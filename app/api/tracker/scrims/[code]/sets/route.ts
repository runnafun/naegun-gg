import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { settleRankedAutomatically } from "@/app/lib/ranked-auto-settlement";
import { getTrackerPrincipal } from "@/app/lib/tracker-desktop-auth";
import { loadTrackerScrim, getTrackerRoster, normalizeRiotId } from "@/app/lib/tracker-access";
export const dynamic = "force-dynamic";
const reply = (error:string, status:number) => NextResponse.json({ok:false,error},{status});
const compact = (v:unknown) => typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v*100)/100) : 0;
type Player = {riotId: string; team: string; champion?:string; kills?:number; deaths?:number;
 assists?:number; cs?:number; vision?:number; level?:number; items?:unknown; runes?:unknown; spells?:unknown};
type Result = {matchCode?:string; set?:number; winner?:"A"|"B"; verifiedBy?:string;
 gameTime?:number; collectorName?:string; endEvents?: Array<{EventName?:string;Result?:string}>; players?:Player[]};

async function respondWithAutoSettlement(code:string,duplicate:boolean){
  try {
    const settlement = await settleRankedAutomatically(code);
    return NextResponse.json({ok:true,duplicate, ...settlement});
  } catch (e) {
    console.error("RANKED_AUTO_SETTLE_FAILED",code,e);
    return NextResponse.json({ok:false,error:"AUTO_SETTLEMENT_RETRY_REQUIRED"},{status:503});
  }
}

export async function POST(request:NextRequest,context:{params:Promise<{code:string}>}) {
  const code = (await context.params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return reply("RANKED_CODE_REQUIRED",400);
  const scrim = await loadTrackerScrim(code);
  if (!scrim) return reply("NOT_CONFIRMED_OR_NOT_FOUND",404);
  if (!await getTrackerPrincipal(request)) return reply("TRACKER_SESSION_INVALID_OR_EXPIRED",401);
  const raw = await request.text();
  if (raw.length > 100000) return reply("PAYLOAD_TOO_LARGE",413);
  let body: Result;
  try { body = JSON.parse(raw); } catch { return reply("INVALID_JSON",400); }
  if (body.matchCode !== code || ![1,2,3].includes(body.set ?? 0) ||
    !["A","B"].includes(body.winner ?? "") ||
    !["game_end_auto","manual_confirmation"].includes(body.verifiedBy ?? ""))
    return reply("INVALID_SET_RESULT",400);
  if (!Array.isArray(body.players) || body.players.length !== 10 ||
    typeof body.gameTime !== "number" || body.gameTime < 60 || body.gameTime > 21600)
    return reply("INCOMPLETE_GAME_DATA",400);
  const roster = await getTrackerRoster(scrim);
  const known = new Map(roster.map(p=>[normalizeRiotId(p.riotId),p.team]));
  const sides = new Map<string,string>();
  const ids = new Set<string>();
  for (const p of body.players) {
    if (typeof p.riotId !== "string" || !["ORDER","CHAOS"].includes(p.team)) return reply("INVALID_PLAYER",400);
    const id = normalizeRiotId(p.riotId);
    if (ids.has(id) || !known.has(id)) return reply("PLAYER_ROSTER_MISMATCH",409);
    ids.add(id);
    const side = sides.get(known.get(id)!);
    if (side && side !== p.team) return reply("TEAM_SIDE_MISMATCH",409);
    sides.set(known.get(id)!,p.team);
  }
  if (ids.size !== 10 || sides.size !== 2 || sides.get("A")===sides.get("B")) return reply("TEAM_SIDE_MISMATCH",409);
  if (body.verifiedBy === "game_end_auto") {
    const endings = (body.endEvents ?? []).filter(e=>e.EventName==="GameEnd");
    const outcomes = new Set(endings.map(e=>String(e.Result??"").toLowerCase()));
    const collector = normalizeRiotId(String(body.collectorName??""));
    const collectorSide = body.players.find(p=>normalizeRiotId(p.riotId)===collector)?.team;
    if (outcomes.size!==1 || !["win","lose"].includes([...outcomes][0]) || !collectorSide) return reply("GAMEEND_NOT_VERIFIABLE",409);
    const winningSide = outcomes.has("win") ? collectorSide : (collectorSide==="ORDER"?"CHAOS":"ORDER");
    if (sides.get(body.winner!)!==winningSide) return reply("WINNER_VERIFICATION_FAILED",409);
  }
  const principal = await getTrackerPrincipal(request);
  if (!principal) return reply("UNAUTHORIZED",401);
  if (normalizeRiotId(String(body.collectorName??"")) !== normalizeRiotId(principal.riotId))
    return reply("COLLECTOR_ACCOUNT_MISMATCH",409);
  const event = {submitterDiscordUserId:principal.discordUserId,submitterUserId:principal.userId,
    code,set:body.set,winner:body.winner,verifiedBy:body.verifiedBy,
    gameTime:compact(body.gameTime),collectorName:body.collectorName??null,
    receivedAt:new Date().toISOString(),status:body.verifiedBy==="game_end_auto"?"AUTO_VERIFIED":"MANUAL_REVIEW",
    teamMapping:Object.fromEntries(sides),
    players:body.players.map(p=>({riotId:p.riotId, team:p.team,
      champion: String(p.champion??"").slice(0,80),kills:compact(p.kills),
      deaths:compact(p.deaths),assists:compact(p.assists),cs:compact(p.cs),
      vision:compact(p.vision),level:compact(p.level),
      items:Array.isArray(p.items)?p.items.slice(0,10):[],
      runes:p.runes??null,spells:p.spells??null})),
  };
  const existing = await prisma.adminAuditLog.findMany({
    where:{action:"TRACKER_SET_RECEIVED",targetType:"Scrim",targetId:scrim.id},
    orderBy:{createdAt:"desc"},take:20,select:{afterData:true},
  });
  for (const e of existing) {
    const prev=e.afterData as {set?:number;winner?:string}|null;
    if (prev?.set===body.set) {
      if(prev?.winner===body.winner) return respondWithAutoSettlement(code,true);
      return reply("SET_CONFLICT_ADMIN_REVIEW_REQUIRED",409);
    }
  }
  await prisma.adminAuditLog.create({data:{action:"TRACKER_SET_RECEIVED",targetType:"Scrim",targetId:scrim.id,
    reason:`${body.set}세트 수집 (${body.verifiedBy})`,afterData:JSON.parse(JSON.stringify(event))}});
  return respondWithAutoSettlement(code,false);
}
