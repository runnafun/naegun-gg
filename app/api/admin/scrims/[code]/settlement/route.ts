import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
import { applyProtection,applyRankResult,getRank,loadRankSettlement } from "@/app/lib/ranked-rewards";
export const dynamic="force-dynamic";
const fail=(message:string,status:number)=>NextResponse.json({ok:false,error:message},{status});
type Params={params:Promise<{code:string}>};
function err(e:unknown){return e instanceof Error?e.message:String(e)}

export async function GET(request:NextRequest,context:Params){
  const admin=await requireAdmin(request);
  if(!admin.ok)return fail("ADMIN_REQUIRED",admin.status);
  const code=(await context.params).code.toUpperCase();
  try {
    const preview=await loadRankSettlement(code);
    return NextResponse.json({ok:true,code,status:"READY_TO_SETTLE",winner:preview.winner,
      wins:preview.wins,sets:preview.sets.map(s=>({set:s.set,winner:s.winner,verifiedBy:s.verifiedBy})),
      suggestedMvp:preview.suggestedMvp,suggestedAce:preview.suggestedAce,
      players:preview.playerRatings},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return fail(err(e),409)}
}

export async function POST(request:NextRequest,context:Params){
  const admin=await requireAdmin(request);
  if(!admin.ok)return fail("ADMIN_REQUIRED",admin.status);
  let body:{confirm?:boolean;mvpUserId?:string;aceUserId?:string};
  try {body=await request.json()}catch{return fail("INVALID_JSON",400)}
  if(body.confirm!==true)return fail("ADMIN_CONFIRM_REQUIRED",400);
  const code=(await context.params).code.toUpperCase();
  try {
    const info=await loadRankSettlement(code);
    const mvp=body.mvpUserId??info.suggestedMvp;
    const ace=body.aceUserId??info.suggestedAce;
    if(!info.participants.some(p=>p.userId===mvp&&p.team===info.winner)||
       !info.participants.some(p=>p.userId===ace&&p.team===info.loser))return fail("INVALID_MVP_OR_ACE",400);
    const finishedAt=new Date();
    const result=await prisma.$transaction(async tx=>{
      // 조건부 상태 변경이 정산 작업 전체의 중복 실행을 방지함.
      const lock=await tx.scrim.updateMany({where:{id:info.scrim.id,type:"RANKED",status:"IN_PROGRESS"},
        data:{status:"FINISHED",finishedAt}});
      if(lock.count!==1)throw new Error("ALREADY_SETTLED_OR_STATUS_CHANGED");
      const records=[];
      for(const p of info.participants){
        const win=p.team===info.winner;
        const isMvp=p.userId===mvp,isAce=p.userId===ace;
        const [stats,defense]=await Promise.all([
          tx.userStats.findUnique({where:{userId:p.userId}}),
          tx.defenseStats.findUnique({where:{userId:p.userId}}),
        ]);
        const rank=applyRankResult(stats?.tierScore??0,win,defense?.tickets??0);
        const protection=applyProtection(defense?.progress??0,
          (defense?.tickets??0)-(rank.usedTicket?1:0),5+(isMvp?50:0)+(isAce?25:0));
        const streak=win?(stats?.currentStreak??0)+1:0;
        const [wins,losses]=[(stats?.wins??0)+(win?1:0),(stats?.losses??0)+(win?0:1)];
        await tx.userStats.upsert({where:{userId:p.userId},create:{userId:p.userId,wins,losses,
          currentStreak:streak,bestStreak:Math.max(stats?.bestStreak??0,streak),tierScore:rank.after},
          update:{wins,losses,currentStreak:streak,bestStreak:Math.max(stats?.bestStreak??0,streak),tierScore:rank.after}});
        await tx.defenseStats.upsert({where:{userId:p.userId},create:{userId:p.userId,progress:protection.progress,tickets:protection.tickets},
          update:{progress:protection.progress,tickets:protection.tickets}});
        const reward=win?500:250;
        await tx.wallet.upsert({where:{userId:p.userId},create:{userId:p.userId,balance:BigInt(reward)},
          update:{balance:{increment:BigInt(reward)}}});
        await tx.walletTransaction.create({data:{userId:p.userId,scrimId:info.scrim.id,
          amount:BigInt(reward),type:win?"SCRIM_WIN":"SCRIM_LOSS",
          idempotencyKey:`RANKED_BO3:${info.scrim.id}:${p.userId}`,
          description:`${code} BO3 ${win?"승리":"패배"} 보상`,createdById:admin.user.id}});
        await tx.scrimParticipant.update({where:{id:p.id},data:{isMvp,isAce}});
        records.push({userId:p.userId,discordUserId:p.user.discordAccount!.discordUserId,
          team:p.team,win,oldScore:rank.before,newScore:rank.after,
          oldRank:getRank(rank.before),newRank:getRank(rank.after),usedTicket:rank.usedTicket,
          progress:protection.progress,tickets:protection.tickets,earnedTicket:protection.earned,
          coins:reward,isMvp,isAce});
      }
      for(const set of info.sets){
        await tx.game.upsert({where:{scrimId_gameNumber:{scrimId:info.scrim.id,gameNumber:set.set}},
          create:{scrimId:info.scrim.id,gameNumber:set.set,status:"FINISHED",winnerTeam:set.winner,finishedAt},
          update:{status:"FINISHED",winnerTeam:set.winner,finishedAt}});
      }
      await tx.adminAuditLog.create({data:{adminId:admin.user.id,action:"RANKED_SETTLED",targetType:"Scrim",
        targetId:info.scrim.id,reason:`${code} BO3 운영자 승인 정산`,
        afterData:{code,winner:info.winner,wins:info.wins,sets:info.sets.map(s=>({set:s.set,winner:s.winner})),
          mvpUserId:mvp,aceUserId:ace,participants:records}}});
      return {winner:info.winner,wins:info.wins,participants:records};
    },{maxWait:10000,timeout:60000});
    return NextResponse.json({ok:true,status:"FINISHED",...result});
  }catch(e){
    console.error("RANKED_SETTLEMENT",err(e));
    const message=err(e);
    return fail(message, /ALREADY_SETTLED|STATUS_CHANGED|UNIQUE|P2002/.test(message)?409:400);
  }
}
