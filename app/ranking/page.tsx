import Header from "../components/Header";
import Footer from "../components/Footer";
import {getFrameMap} from "@/app/lib/naegun-shop-db";
import "@/app/components/shop/naegun-shop-ui.css";

import RankingHero from "../components/ranking/RankingHero";
import RankingTable from "../components/ranking/RankingTable";

import "./ranking.css";
import { getRankingUsers } from "../lib/ranking";
import { getLiveRankingRows } from "../lib/live-rank";
import { unstable_cache } from "next/cache";
import type { RankingUser } from "../data/ranking";

export const dynamic = "force-dynamic";

// Public ranking, with a short shared server cache to avoid 5+ simultaneous
// visitors querying the same RDS match data independently.
// Only the displayed 50 users need most-champion lookups.
const loadPublicRankingData = unstable_cache(
  async () => {
    const liveRows = await getLiveRankingRows();
    const displayUsers = await getRankingUsers(
      liveRows.slice(0, 50).map((row) => row.puuid),
    );
    return { liveRows, displayUsers };
  },
  ["naegun-public-ranking-page-v1"],
  { revalidate: 30 },
);

// Deduplicate a cache miss across simultaneous requests on this server.
type RankingPageData = Awaited<ReturnType<typeof loadPublicRankingData>>;
let rankingInFlight: Promise<RankingPageData> | null = null;
async function getRankingPageData(): Promise<RankingPageData> {
  if (rankingInFlight) return rankingInFlight;
  const request = loadPublicRankingData();
  rankingInFlight = request;
  try {
    return await request;
  } finally {
    if (rankingInFlight === request) rankingInFlight = null;
  }
}

export default async function RankingPage() {
  // NAEGUN_RANKING_RDS_PAGE_FIX_V1
  // 랭킹 순위·내전 랭크·승률은 오직 RDS UserStats 기반으로 계산합니다.
  // 기존 소환사 이미지/모스트챔피언/탑레이팅 정보는 표시용으로만 재사용합니다.
  const { liveRows, displayUsers } = await getRankingPageData();

  const riotId = (name: string, tagLine: string) =>
    `${name.trim().toLowerCase()}#${tagLine.trim().replace(/^#/, "").toLowerCase()}`;
  const byPuuid = new Map(displayUsers.map((user) => [user.puuid, user]));
  const byRiotId = new Map(
    displayUsers.map((user) => [riotId(user.gameName, user.tagLine), user]),
  );

  const ngFrames=await getFrameMap(liveRows.slice(0,50).map(row=>row.puuid));

  const users: RankingUser[] = liveRows.slice(0, 50).map((row) => {
    const display = byPuuid.get(row.puuid) ??
      byRiotId.get(riotId(row.gameName, row.tagLine));

    return {
      puuid: row.puuid,
      frameSku:ngFrames[row.puuid]??null,
      gameName: row.gameName,
      tagLine: row.tagLine,
      rank: row.position,
      summonerName: display?.summonerName ?? `${row.gameName}#${row.tagLine}`,
      profileIcon: display?.profileIcon ?? row.profileIcon,
      internalRank: row.rankDisplay,
      soloTier: display?.soloTier ?? row.soloTier,
      mostChampions: display?.mostChampions ?? [],
      winRate: row.winRate,
    };
  });

  return (
    <main className="ranking-page">
      <Header active="ranking" />

      <RankingHero />

      <RankingTable users={users} />

      <Footer />
    </main>
  );
}
// NAEGUN_SHOP_V1
