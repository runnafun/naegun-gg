import { prisma } from "@/app/lib/prisma";
import { getRank } from "@/app/lib/ranked-rewards";

// 전적 없는 등록 회원은 표시하되 공식 순위에는 넣지 않음.
export async function getLiveRankingRows() {
  const accounts = await prisma.riotAccount.findMany({
    where: { user: { status: "ACTIVE" } },
    select: {
      userId: true, puuid: true, gameName: true, tagLine: true,
      profileIconId: true, soloTier: true, soloRank: true, soloLp: true,
      user: { select: { stats: { select: { tierScore: true, wins: true, losses: true } } } },
    },
  });
  const rows = accounts.map((a) => {
    const score = a.user.stats?.tierScore ?? 0;
    const wins = a.user.stats?.wins ?? 0;
    const losses = a.user.stats?.losses ?? 0;
    const rank = getRank(score);
    return {
      userId: a.userId, puuid: a.puuid, gameName: a.gameName, tagLine: a.tagLine,
      profileIcon: `https://ddragon.leagueoflegends.com/cdn/16.19.1/img/profileicon/${a.profileIconId ?? 29}.png`,
      soloTier: a.soloTier ? `${a.soloTier}${a.soloRank ? " " + a.soloRank : ""} ${a.soloLp ?? 0}LP` : "언랭크",
      score: rank.totalScore, tier: rank.rank, shields: rank.shields,
      capacity: rank.capacity, rankDisplay: `${rank.rank} (${rank.shields}/${rank.capacity})`,
      wins, losses, played: wins + losses > 0,
      winRate: wins + losses > 0 ? Math.round(wins / (wins + losses) * 100) : null,
    };
  });
  // 참가한 선수만 공식 순위를 받는다. 참가 횟수는 순위를 높이지 않는다.
  const rankedPlayers = rows.filter((row) => row.played);
  const unrankedPlayers = rows.filter((row) => !row.played);
  rankedPlayers.sort((a, b) =>
    b.score - a.score ||         // 1. 누적 랭크 점수(tierScore)
    b.wins - a.wins ||           // 2. 승리 수
    a.losses - b.losses ||       // 3. 패배 적은 순
    a.userId.localeCompare(b.userId) // 완전 동점일 때 표시 순서만 고정
  );
  unrankedPlayers.sort((a, b) =>
    a.gameName.localeCompare(b.gameName, "ko") ||
    a.userId.localeCompare(b.userId)
  );

  // Equal scores remain tied by score, but positions are displayed sequentially.
  // MVP/ACE/protection gauge do not affect the sorting.
  const ranked = rankedPlayers.map((row, index) => ({ ...row, position: index + 1 }));
  return [
    ...ranked,
    ...unrankedPlayers.map((row) => ({ ...row, position: 0 })),
  ];

}
