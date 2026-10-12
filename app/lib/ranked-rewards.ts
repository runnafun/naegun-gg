import { prisma } from "@/app/lib/prisma";

export const RANK_CONFIG = [
  { rank: "F", shields: 3, start: 0 },
  { rank: "E", shields: 7, start: 3 },
  { rank: "D", shields: 12, start: 10 },
  { rank: "C", shields: 20, start: 22 },
  { rank: "B", shields: 20, start: 42 },
  { rank: "A", shields: 20, start: 62 },
  { rank: "S", shields: 20, start: 82 },
] as const;

export const MAX_SHIELDS = 102;
export const RANK_ROLE_IDS: Record<string,string> = {
  F: "1558230251702591488",
  E: "1558230435169833113",
  D: "1558230565897904158",
  C: "1558232665860350092",
  B: "1558233196980731925",
  A: "1558233608433705071",
  S: "1558234024965709834",
};

export function getRank(score: number) {
  const safe = Math.max(0, Math.min(MAX_SHIELDS, Math.trunc(score)));
  const selected = [...RANK_CONFIG].reverse().find((r) => safe >= r.start)!;
  return { rank: selected.rank, shields: safe - selected.start,
    capacity: selected.shields, totalScore: safe };
}

export function applyRankResult(oldScore:number, win:boolean, availableTickets:number) {
  const before = Math.max(0,Math.min(MAX_SHIELDS,Math.trunc(oldScore)));
  const usedTicket = !win && availableTickets > 0;
  const after = win ? Math.min(MAX_SHIELDS,before+1)
                    : (usedTicket ? before : Math.max(0,before-1));
  return {before, after, usedTicket, beforeRank:getRank(before), afterRank:getRank(after)};
}

export function applyProtection(oldProgress:number, afterLossTickets:number, bonus:number) {
  let progress = Math.max(0,Math.trunc(oldProgress)) + bonus;
  let tickets = Math.max(0,Math.min(2,Math.trunc(afterLossTickets)));
  let earned=0;
  while (progress >= 100 && tickets < 2) {
    progress-=100; tickets++; earned++;
  }
  if (tickets === 2) progress=Math.min(99,progress);
  return {progress,tickets,earned};
}

const normalizedId = (x:string) => x.normalize("NFKC").toLowerCase().replace(/\s+/g, "").trim();
type Side = "A"|"B";
type Player = {riotId:string;team:string;kills?:number;deaths?:number;assists?:number;cs?:number;vision?:number};
type Report = {set:number; winner:Side; gameTime:number; players:Player[]; verifiedBy?:string};
const clamp01=(n:number)=>Math.max(0,Math.min(1, Number.isFinite(n)?n:0));
const safeNum=(n:unknown)=>typeof n==="number" && Number.isFinite(n) && n>=0?n:0;

export async function loadRankSettlement(code:string) {
  const scrim=await prisma.scrim.findUnique({
    where:{code},include:{participants:{where:{status:"CONFIRMED"},include:{user:{include:{discordAccount:true,riotAccount:true}}}}},
  });
  if(!scrim || scrim.type!=="RANKED") throw new Error("RANKED_SCRIM_NOT_FOUND");
  if(scrim.status!=="IN_PROGRESS") throw new Error(scrim.status==="FINISHED"?"ALREADY_SETTLED":"TEAM_NOT_CONFIRMED");
  const participants=scrim.participants;
  if(participants.length!==10 || participants.filter(p=>p.team==="A").length!==5 ||
     participants.filter(p=>p.team==="B").length!==5 ||
     participants.some(p=>!p.user.riotAccount || !p.user.discordAccount)) throw new Error("ROSTER_INCOMPLETE");
  const byRiot=new Map(participants.map(p=>[
    normalizedId(`${p.user.riotAccount!.gameName}#${p.user.riotAccount!.tagLine}`),p,
  ]));
  if(byRiot.size!==10) throw new Error("ROSTER_DUPLICATE_RIOT_ID");

  const logs=await prisma.adminAuditLog.findMany({
    where:{action:"TRACKER_SET_RECEIVED",targetType:"Scrim",targetId:scrim.id},
    orderBy:{createdAt:"asc"},take:30,select:{afterData:true},
  });
  const setMap=new Map<number,Report>();
  for(const log of logs) {
    const value=log.afterData as unknown as Report|null;
    if(!value || ![1,2,3].includes(value.set) || !["A","B"].includes(value.winner)) throw new Error("INVALID_SET_REPORT");
    const old=setMap.get(value.set);
    if(old && JSON.stringify(old)!==JSON.stringify(value)) throw new Error("CONFLICTING_SET_REPORTS");
    setMap.set(value.set,value);
  }
  const first=setMap.get(1),second=setMap.get(2);
  if(!first||!second)throw new Error("TWO_SETS_NOT_RECEIVED");
  const needThird=first.winner!==second.winner;
  if(needThird && !setMap.has(3)) throw new Error("THIRD_SET_NOT_RECEIVED");
  if(!needThird && setMap.has(3))throw new Error("UNEXPECTED_THIRD_SET");
  const selected=[first,second,...(needThird?[setMap.get(3)!]:[])];
  const wins={A:0,B:0};
  for(const r of selected) wins[r.winner]++;
  if(Math.max(wins.A,wins.B)!==2)throw new Error("BO3_NOT_FINISHED");
  const winner:Side=wins.A===2?"A":"B";
  const loss:Side=winner==="A"?"B":"A";

  const posLog=await prisma.adminAuditLog.findFirst({
    where:{action:"RANKED_TEAM_CONFIRMED",targetType:"Scrim",targetId:scrim.id},
    orderBy:{createdAt:"desc"},select:{afterData:true},
  });
  type PositionEntry={userId:string;assignedPosition:string};
  const positions=posLog?.afterData as {blue?:PositionEntry[];red?:PositionEntry[]}|null;
  const posMap=new Map([...(positions?.blue??[]),...(positions?.red??[])].map(p=>[p.userId,p.assignedPosition]));
  const overall=new Map(participants.map(p=>[p.userId,{total:0,count:0}]));
  for(const set of selected) {
    if(!Array.isArray(set.players)||set.players.length!==10||!Number.isFinite(set.gameTime)||set.gameTime<60)throw new Error("INCOMPLETE_GAME_REPORT");
    const seen=new Set<string>();
    const sides=new Map<Side,string>();
    const killsBySide=new Map<Side,number>([["A",0],["B",0]]);
    for(const player of set.players){
      if(typeof player.riotId!=="string")throw new Error("INVALID_PLAYER_DATA");
      const p=byRiot.get(normalizedId(player.riotId));
      if(!p || !p.team || seen.has(p.userId) || !["ORDER","CHAOS"].includes(player.team))throw new Error("SET_ROSTER_MISMATCH");
      seen.add(p.userId);
      const side=p.team as Side;
      if(sides.has(side)&&sides.get(side)!==player.team)throw new Error("TEAM_SIDE_MISMATCH");
      sides.set(side,player.team);
      killsBySide.set(side,killsBySide.get(side)!+safeNum(player.kills));
    }
    if(seen.size!==10||sides.get("A")===sides.get("B")||sides.size!==2)throw new Error("SET_ROSTER_MISMATCH");
    for(const player of set.players){
      const p=byRiot.get(normalizedId(player.riotId))!;
      const k=safeNum(player.kills),d=safeNum(player.deaths),a=safeNum(player.assists);
      const cs=safeNum(player.cs),vision=safeNum(player.vision);
      const minutes=set.gameTime/60;
      const kp=clamp01((k+a)/Math.max(1,killsBySide.get(p.team as Side)!));
      const kda=clamp01(((k+a)/Math.max(1,d))/6);
      const support=(posMap.get(p.userId)??p.mainPosition)==="SUPPORT";
      const score=support
        ? 0.4*kp+0.3*kda+0.3*clamp01((vision/minutes)/2.5)
        : 0.4*kp+0.3*kda+0.15*clamp01((cs/minutes)/10)+0.15*clamp01((vision/minutes)/1.5);
      const total=overall.get(p.userId)!;
      total.total+=score; total.count++;
    }
  }
  const highest=(team:Side)=>participants.filter(p=>p.team===team).sort((a,b)=>{
    const aa=overall.get(a.userId)!,bb=overall.get(b.userId)!;
    return bb.total/bb.count-aa.total/aa.count || a.userId.localeCompare(b.userId);
  })[0];
  if([...overall.values()].some(v=>v.count!==selected.length))throw new Error("PLAYER_SET_DATA_INCOMPLETE");
  if([...overall.values()].every(v=>v.total===0))throw new Error("EMPTY_PLAYER_STATISTICS");
  return {scrim,participants,sets:selected,wins,winner,loser:loss,
    suggestedMvp:highest(winner).userId,suggestedAce:highest(loss).userId,
    playerRatings:participants.map(p=>({userId:p.userId,discordUserId:p.user.discordAccount!.discordUserId,
      riotId:`${p.user.riotAccount!.gameName}#${p.user.riotAccount!.tagLine}`,team:p.team!,
      score:Number((overall.get(p.userId)!.total/selected.length).toFixed(4))}))};
}
