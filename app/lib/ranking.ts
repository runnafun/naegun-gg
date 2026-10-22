import { prisma } from "./prisma";
import type { RankingUser } from "../data/ranking";
import type { RiotMatchDto } from "./riot";

const DDRAGON =
  "https://ddragon.leagueoflegends.com/cdn/16.19.1/img";

const RANKS = [
  "F", "E", "D", "C", "B", "A", "S"
] as const;

const TIER_KO: Record<string, string> = {
  IRON: "아이언",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  EMERALD: "에메랄드",
  DIAMOND: "다이아몬드",
  MASTER: "마스터",
  GRANDMASTER: "그랜드마스터",
  CHALLENGER: "챌린저",
};


// ========================================
// 내전 자체 랭크 계산
// F 0~19 / E 20~39 ... / S 120~
// ========================================

function labelForRank(progress: number) {
  const score = Math.max(
    0, Math.floor(progress)
  );

  const index = Math.min(
    6, Math.floor(score / 20)
  );

  const filled = index === 6
    ? Math.min(20, score - 120)
    : score % 20;

  return `${RANKS[index]} (${filled}/20)`;
}


// ========================================
// 탑레이팅 표시
// ========================================

function labelForPeak(
  tier: string | null,
  division: string | null,
  lp: number | null
) {
  if (!tier || !TIER_KO[tier.toUpperCase()]) {
    return "티어 정보 없음";
  }

  const name = TIER_KO[tier.toUpperCase()];
  const part = division ? ` ${division}` : "";
  const points = lp === null ? "" : ` ${lp}LP`;

  return `${name}${part}${points}`;
}


// ========================================
// 최근 경기에서 모스트 3개 추출
// 외부 Riot API 요청 없음
// ========================================

async function loadMostChampions(
  puuid: string
): Promise<string[]> {
  const rows = await prisma.riotMatchCache.findMany({
    where: {
      puuid,
      queueId: {
        in: [400, 420, 430, 440, 490]
      }
    },
    select: {
      data: true
    },
    orderBy: {
      gameCreation: "desc"
    },
    take: 40
  });

  const counts = new Map<string, number>();

  for (const row of rows) {
    const match =
      row.data as unknown as RiotMatchDto;

    const participants = match?.info?.participants;

    if (!Array.isArray(participants)) {
      continue;
    }

    const champion = participants.find(
      (p) => p.puuid === puuid
    )?.championName;

    if (
      !champion ||
      !/^[A-Za-z0-9]+$/.test(champion)
    ) {
      continue;
    }

    counts.set(
      champion,
      (counts.get(champion) ?? 0) + 1
    );
  }

  return [...counts.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
    )
    .slice(0, 3)
    .map(
      ([name]) =>
        `${DDRAGON}/champion/${name}.png`
    );
}


// ========================================
// 실제 RDS에서 유저 전체 조회
// ========================================

export async function getRankingUsers(
  targetPuuids?: string[],
): Promise<RankingUser[]> {
  if (targetPuuids?.length === 0) return [];

  const accounts = await prisma.riotAccount.findMany({
    where: {
      user: {
        status: {
          not: "DELETED"
        }
      },
      ...(targetPuuids ? { puuid: { in: targetPuuids } } : {}),
    },

    select: {
      puuid: true,
      gameName: true,
      tagLine: true,
      profileIconId: true,
      soloTier: true,
      soloRank: true,
      soloLp: true,
      linkedAt: true,

      user: {
        select: {
          defenseStats: {
            select: {
              progress: true
            }
          },

          stats: {
            select: {
              wins: true,
              losses: true
            }
          },

          balanceProfile: {
            select: {
              peakTier: true,
              peakRank: true,
              peakLp: true
            }
          }
        }
      }
    },

    orderBy: {
      linkedAt: "asc"
    }
  });


  // ====================================
  // 순위 정렬
  // 1. 내전랭크 점수
  // 2. 내전 승리 수
  // 3. 내전 패배 적은 순
  // 4. 최초 등록 순서
  // ====================================

  const sorted = [...accounts].sort(
    (a, b) =>
      (
        (b.user.defenseStats?.progress ?? 0) -
        (a.user.defenseStats?.progress ?? 0)
      ) ||
      (
        (b.user.stats?.wins ?? 0) -
        (a.user.stats?.wins ?? 0)
      ) ||
      (
        (a.user.stats?.losses ?? 0) -
        (b.user.stats?.losses ?? 0)
      ) ||
      (
        a.linkedAt.getTime() -
        b.linkedAt.getTime()
      ) ||
      a.puuid.localeCompare(b.puuid)
  );

  const result: RankingUser[] = [];


  // ====================================
  // 10명씩 나누어 최근 챔피언 기록 조회
  // ====================================

  for (
    let i = 0;
    i < sorted.length;
    i += 10
  ) {
    const batch = sorted.slice(i, i + 10);

    const champions = await Promise.all(
      batch.map(
        (account) =>
          loadMostChampions(account.puuid)
      )
    );

    batch.forEach((account, index) => {
      const wins = account.user.stats?.wins ?? 0;
      const losses = account.user.stats?.losses ?? 0;

      const total = wins + losses;

      result.push({
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,

        rank: i + index + 1,

        summonerName:
          `${account.gameName}#${account.tagLine}`,

        profileIcon:
          `${DDRAGON}/profileicon/` +
          `${account.profileIconId ?? 29}.png`,

        internalRank: labelForRank(
          account.user.defenseStats?.progress ?? 0
        ),

        soloTier: account.user.balanceProfile?.peakTier
          ? labelForPeak(
              account.user.balanceProfile.peakTier,
              account.user.balanceProfile.peakRank,
              account.user.balanceProfile.peakLp
            )
          : account.soloTier
            ? `현재 ${labelForPeak(
                account.soloTier,
                account.soloRank,
                account.soloLp
              )}`
            : "티어 정보 없음",

        mostChampions: champions[index],

        winRate:
          total > 0
            ? Math.round((wins / total) * 100)
            : null
      });
    });
  }

  return result;
}
