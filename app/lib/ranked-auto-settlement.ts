import { prisma } from "@/app/lib/prisma";
import { applyProtection, applyRankResult, getRank, loadRankSettlement } from "@/app/lib/ranked-rewards";
import { revalidatePath } from "next/cache";

// 판정 완료된 게임만 자동 정산. 수동 결과/불완전 데이터는 보류.
const PENDING = new Set([
  "TWO_SETS_NOT_RECEIVED", "THIRD_SET_NOT_RECEIVED", "BO3_NOT_FINISHED",
  "INCOMPLETE_GAME_REPORT", "PLAYER_SET_DATA_INCOMPLETE", "EMPTY_PLAYER_STATISTICS",
  "SET_ROSTER_MISMATCH", "TEAM_SIDE_MISMATCH", "INVALID_PLAYER_DATA",
  "INVALID_SET_REPORT", "CONFLICTING_SET_REPORTS", "UNEXPECTED_THIRD_SET",
  "TEAM_NOT_CONFIRMED", "ROSTER_INCOMPLETE", "ROSTER_DUPLICATE_RIOT_ID",
]);
function errorText(e:unknown){return e instanceof Error?e.message:String(e)}

export async function settleRankedAutomatically(code:string):Promise<{
  status:string;settled:boolean;winner?:string;wins?:{A:number;B:number};reason?:string
}>{
  const normalized=code.trim().toUpperCase();
  let info:Awaited<ReturnType<typeof loadRankSettlement>>;
  try {
    info=await loadRankSettlement(normalized);
  } catch(e){
    const reason=errorText(e);
    if(reason==="ALREADY_SETTLED")return {status:"FINISHED",settled:true};
    if(PENDING.has(reason))return {status:"REVIEW_OR_SETS_PENDING",settled:false,reason};
    throw e;
  }
  // 사용자가 임의로 선택한 결과는 자동 지급하지 않습니다.
  if(info.sets.some(s=>s.verifiedBy!=="game_end_auto")){
    return {status:"MANUAL_RESULT_REVIEW_REQUIRED",settled:false};
  }
  const finishedAt=new Date();
  const result=await prisma.$transaction(async tx=>{
    // 1건의 시리즈 정산만 허용. 나머지 시도는 이 트랜잭션에서 롤백.
    const lock=await tx.scrim.updateMany({
      where:{id:info.scrim.id,type:"RANKED",status:"IN_PROGRESS"},
      data:{status:"FINISHED",finishedAt},
    });
    if(lock.count!==1)throw new Error("ALREADY_SETTLED_OR_STATUS_CHANGED");
    const records=[];
    for(const p of info.participants){
      const win=p.team===info.winner;
      const isMvp=p.userId===info.suggestedMvp;
      const isAce=p.userId===info.suggestedAce;
      const stats=await tx.userStats.findUnique({where:{userId:p.userId}});
      const defense=await tx.defenseStats.findUnique({where:{userId:p.userId}});
      const rank=applyRankResult(stats?.tierScore??0,win,defense?.tickets??0);
      const protection=applyProtection(defense?.progress??0,
        (defense?.tickets??0)-(rank.usedTicket?1:0),5+(isMvp?50:0)+(isAce?25:0));
      const streak=win?(stats?.currentStreak??0)+1:0;
      const wins=(stats?.wins??0)+(win?1:0);
      const losses=(stats?.losses??0)+(win?0:1);
      await tx.userStats.upsert({where:{userId:p.userId},
        create:{userId:p.userId,wins,losses,currentStreak:streak,
          bestStreak:Math.max(stats?.bestStreak??0,streak),tierScore:rank.after},
        update:{wins,losses,currentStreak:streak,
          bestStreak:Math.max(stats?.bestStreak??0,streak),tierScore:rank.after}});
      await tx.defenseStats.upsert({where:{userId:p.userId},
        create:{userId:p.userId,progress:protection.progress,tickets:protection.tickets},
        update:{progress:protection.progress,tickets:protection.tickets}});
      const coins=win?500:250;
      await tx.wallet.upsert({where:{userId:p.userId},
        create:{userId:p.userId,balance:BigInt(coins)},
        update:{balance:{increment:BigInt(coins)}}});
      await tx.walletTransaction.create({data:{userId:p.userId,scrimId:info.scrim.id,
        amount:BigInt(coins),type:win?"SCRIM_WIN":"SCRIM_LOSS",
        idempotencyKey:`RANKED_BO3:${info.scrim.id}:${p.userId}`,
        description:`${normalized} BO3 ${win?"승리":"패배"} 자동 보상`,
        createdById:null}});
      await tx.scrimParticipant.update({where:{id:p.id},data:{isMvp,isAce}});
      records.push({userId:p.userId,discordUserId:p.user.discordAccount!.discordUserId,
        team:p.team,win,oldScore:rank.before,newScore:rank.after,
        oldRank:getRank(rank.before),newRank:getRank(rank.after),usedTicket:rank.usedTicket,
        progress:protection.progress,tickets:protection.tickets,earnedTicket:protection.earned,
        coins,isMvp,isAce});
    }
    for(const set of info.sets){
      await tx.game.upsert({where:{scrimId_gameNumber:{scrimId:info.scrim.id,gameNumber:set.set}},
        create:{scrimId:info.scrim.id,gameNumber:set.set,status:"FINISHED",winnerTeam:set.winner,finishedAt},
        update:{status:"FINISHED",winnerTeam:set.winner,finishedAt}});
    }
    await tx.adminAuditLog.create({data:{action:"RANKED_SETTLED",targetType:"Scrim",
      targetId:info.scrim.id,reason:`${normalized} BO3 자동 정산`,
      afterData:{code:normalized,winner:info.winner,wins:info.wins,
        sets:info.sets.map(s=>({set:s.set,winner:s.winner})),
        mvpUserId:info.suggestedMvp,aceUserId:info.suggestedAce,participants:records}}});
    return {winner:info.winner,wins:info.wins};
  },{maxWait:10000,timeout:60000});
  // 캐시 무효화 실패가 이미 완료된 보상을 오류로 보이게 해서는 안 됨.
  try{revalidatePath("/ranking");revalidatePath("/matches/result");}
  catch(e){console.warn("RANKED_REVALIDATE_WARN",errorText(e));}
  return {status:"FINISHED",settled:true,winner:result.winner,wins:result.wins};
}
