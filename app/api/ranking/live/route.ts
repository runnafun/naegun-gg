import { NextRequest, NextResponse } from "next/server";
import { getLiveRankingRows } from "@/app/lib/live-rank";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const all = await getLiveRankingRows();
    const searchId = (request.nextUrl.searchParams.get("riotId") ?? "").normalize("NFKC").toLowerCase();
    const me = searchId ? all.find((p) => `${p.gameName}#${p.tagLine}`.normalize("NFKC").toLowerCase() === searchId) ?? null : null;
    const players = all.slice(0, 200).map(({ userId, puuid, ...publicData }) => publicData);
    const publicMe = me ? { position: me.position, rankDisplay: me.rankDisplay, played: me.played } : null;
    return NextResponse.json({ ok: true, players, leader: players.find((p) => p.position === 1) ?? null, me: publicMe },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("LIVE_RANKING_ERROR", error);
    return NextResponse.json({ ok: false, error: "RANKING_UNAVAILABLE" }, { status: 500 });
  }
}
