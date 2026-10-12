import { prisma } from "./prisma";
import { CHAMPION_KO } from "../data/champion-ko";
import type { MatchHistoryItem, MatchPlayer, MatchTeamPlayer } from "../data/profile";

// Only read finished ranked games with verified, stored tracker reports.
// Never grant currency or modify any result from this read-only view.
type Side = "A" | "B";
type TrackerPlayer = {
  riotId?: string; team?: string; champion?: string;
  kills?: number; deaths?: number; assists?: number; cs?: number;
  level?: number; vision?: number; items?: unknown[];
};
type TrackerEvent = {
  set?: number; winner?: string; gameTime?: number;
  receivedAt?: string; players?: TrackerPlayer[];
  teamMapping?: { A?: string; B?: string };
};
const ENGLISH_BY_KOREAN = new Map(
  Object.entries(CHAMPION_KO).map(([english, korean]) => [korean, english]),
);
const CDN = "https://ddragon.leagueoflegends.com/cdn/16.19.1/img";
const normalized = (s: unknown) => String(s ?? "").replace(/\s+/g, "").toLowerCase();
const numeric = (value: unknown) => typeof value === "number" && Number.isFinite(value)
  ? Math.max(0, value) : 0;
function championKey(v: unknown) {
  const name = String(v ?? "");
  return ENGLISH_BY_KOREAN.get(name) ?? (name.replace(/[^a-zA-Z0-9]/g, "") || "Aatrox");
}
function image(v: unknown) {
  return `${CDN}/champion/${encodeURIComponent(championKey(v))}.png`;
}
function itemImages(v: unknown) {
  return (Array.isArray(v) ? v : []).flatMap((x) => {
    const id = typeof x === "number" ? x : x && typeof x === "object"
      ? Number((x as { id?: unknown }).id) : 0;
    return Number.isInteger(id) && id > 0 && id !== 3340 && id < 100000
      ? [`${CDN}/item/${id}.png`] : [];
  }).slice(0, 6);
}
function mini(p: TrackerPlayer, isMe: boolean): MatchPlayer {
  return {name: String(p.riotId || "알 수 없음"), championImage: image(p.champion),
    level: numeric(p.level), kda: `${numeric(p.kills)}/${numeric(p.deaths)}/${numeric(p.assists)}`, isMe};
}
function detail(p: TrackerPlayer): MatchTeamPlayer {
  return {name:String(p.riotId || "알 수 없음"),championImage:image(p.champion),
    level:numeric(p.level),opScore:0,kills:numeric(p.kills),deaths:numeric(p.deaths),
    assists:numeric(p.assists),damage:-1,wards:"-",cs:numeric(p.cs),items:itemImages(p.items)};
}
function ago(date: Date) {
  const minutes=Math.max(1,Math.floor((Date.now()-date.getTime())/60000));
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes/60)}시간 전`;
  return `${Math.floor(minutes/1440)}일 전`;
}
function duration(sec: number) {
  const s=Math.max(0,Math.floor(sec));
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
}

export async function getRankedProfileHistory(userId: string): Promise<MatchHistoryItem[]> {
  const scrims = await prisma.scrim.findMany({
    where:{type:"RANKED",status:"FINISHED",participants:{some:{userId,status:"CONFIRMED"}}},
    select:{id:true,code:true,finishedAt:true,
      participants:{where:{status:"CONFIRMED"},select:{userId:true,team:true,
        user:{select:{riotAccount:{select:{gameName:true,tagLine:true}}}}}},
      games:{where:{status:"FINISHED"},orderBy:{gameNumber:"asc"},
        select:{gameNumber:true,winnerTeam:true}}},
    orderBy:{finishedAt:"desc"},take:30,
  });
  if (!scrims.length) return [];
  const ids=scrims.map(s=>s.id);
  const logs=await prisma.adminAuditLog.findMany({
    where:{action:"TRACKER_SET_RECEIVED",targetType:"Scrim",targetId:{in:ids}},
    orderBy:{createdAt:"desc"},take:120,
    select:{targetId:true,createdAt:true,afterData:true},
  });
  const rows: Array<{at:number;match:MatchHistoryItem}> = [];
  for (const scrim of scrims) {
    const me=scrim.participants.find(p=>p.userId===userId);
    if (!me || !me.team || !me.user.riotAccount) continue;
    const myRiotId=normalized(`${me.user.riotAccount.gameName}#${me.user.riotAccount.tagLine}`);
    const logItems=logs.filter(l=>l.targetId===scrim.id);
    for (const game of scrim.games) {
      if (!game.winnerTeam) continue;
      const log=logItems.find(l=>{
        const report=l.afterData as unknown as TrackerEvent|null;
        return report?.set===game.gameNumber && report?.winner===game.winnerTeam &&
          Array.isArray(report?.players) && report.players.length===10;
      });
      if (!log) continue;
      const report=log.afterData as unknown as TrackerEvent;
      const players=report.players!;
      const mine=players.find(p=>normalized(p.riotId)===myRiotId);
      if (!mine || !["ORDER","CHAOS"].includes(mine.team??"")) continue;
      const mySide=mine.team;
      const winningSide=report.teamMapping?.[game.winnerTeam as Side];
      if (!winningSide || !["ORDER","CHAOS"].includes(winningSide)) continue;
      const allies=players.filter(p=>p.team===mySide);
      const enemies=players.filter(p=>p.team!==mySide);
      const winners=players.filter(p=>p.team===winningSide);
      const losers=players.filter(p=>p.team!==winningSide);
      if (allies.length!==5 || enemies.length!==5 || winners.length!==5 || losers.length!==5) continue;
      const k=numeric(mine.kills),d=numeric(mine.deaths),a=numeric(mine.assists);
      const cs=numeric(mine.cs),sec=numeric(report.gameTime),minutes=Math.max(1,sec/60);
      const teamKills=allies.reduce((sum,p)=>sum+numeric(p.kills),0);
      const at=log.createdAt;
      const numericCode=Number(scrim.code.replace(/\D/g,""))||0;
      rows.push({at:at.getTime(), match:{
        id:1000000+numericCode*10+game.gameNumber, result:me.team===game.winnerTeam?"win":"lose",
        queue:"내전",queueId:0,ago:`${scrim.code} ${game.gameNumber}세트 · ${ago(at)}`,duration:duration(sec),
        champion:String(mine.champion||"알 수 없음"),championImage:image(mine.champion),
        championLevel:numeric(mine.level),spells:[],runes:[],kills:k,deaths:d,assists:a,
        rating:((k+a)/Math.max(d,1)).toFixed(2),
        killParticipation:teamKills?Math.round((k+a)/teamKills*100):0,laneScore:0,
        cs,csPerMinute:Number((cs/minutes).toFixed(1)),items:itemImages(mine.items),
        trinket:`${CDN}/item/3340.png`,
        allies:allies.map(p=>mini(p,normalized(p.riotId)===myRiotId)),
        enemies:enemies.map(p=>mini(p,false)),
        detail:{blueKills:winners.reduce((s,p)=>s+numeric(p.kills),0),
          redKills:losers.reduce((s,p)=>s+numeric(p.kills),0),blueGold:0,redGold:0,
          blueTeam:winners.map(detail),redTeam:losers.map(detail)},
      }});
    }
  }
  rows.sort((a,b)=>b.at-a.at);
  return rows.slice(0,30).map(x=>x.match);
}
