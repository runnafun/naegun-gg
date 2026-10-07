import { prisma } from "./prisma";

import {
  getScrimByCode,
  searchScrimsByCode,
} from "./scrims/service";

import type {
  MatchLookupData,
  MatchSearchResult,
} from "../data/matches";

function normalizeMatchCode(
  value: string
) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function matchTypeLabel(
  type: string,
): MatchLookupData["matchType"] {
  return type === "RANKED"
    ? "랭크내전"
    : "일반내전";
}

function fearlessLabel(
  rule: string,
): MatchLookupData["fearlessType"] {
  if (rule === "HARD_FEARLESS") {
    return "하드피어리스";
  }

  if (rule === "SOFT_FEARLESS") {
    return "소프트피어리스";
  }

  return "일반";
}

function lookupStatus(
  status: string,
): MatchLookupData["status"] {
  if (status === "OPEN") {
    return "open";
  }

  if (status === "FINISHED") {
    return "finished";
  }

  return "playing";
}

function tierText(
  tier: string | null,
  rank: string | null,
  lp: number | null,
) {
  if (!tier) {
    return "언랭크";
  }

  if (
    tier === "MASTER" ||
    tier === "GRANDMASTER" ||
    tier === "CHALLENGER"
  ) {
    return `${tier} ${lp ?? 0}LP`;
  }

  return `${tier} ${rank ?? ""}`.trim();
}

function winRate(
  wins: number,
  losses: number,
) {
  const total =
    wins + losses;

  if (!total) {
    return 0;
  }

  return Math.round(
    wins / total * 100,
  );
}

function profileIconUrl(
  id: number | null,
) {
  const iconId =
    id ?? 29;

  return `https://ddragon.leagueoflegends.com/cdn/16.19.1/img/profileicon/${iconId}.png`;
}

export async function searchMatchLookups(
  query: string
): Promise<MatchSearchResult[]> {
  const keyword =
    normalizeMatchCode(query);

  if (!keyword) {
    return [];
  }

  const scrims =
    await searchScrimsByCode(
      keyword,
      8,
    );

  return scrims.map(
    (scrim) => ({
      code: scrim.code,
      title: scrim.code,
      matchType:
        matchTypeLabel(scrim.type),
      fearlessType:
        fearlessLabel(scrim.rule),
      status:
        lookupStatus(scrim.status),
    }),
  );
}

export async function getMatchLookupByCode(
  code: string
): Promise<MatchLookupData | null> {
  const normalizedCode =
    normalizeMatchCode(code);

  const scrim =
    await getScrimByCode(
      normalizedCode,
    );

  if (!scrim) {
    return null;
  }

  const rankRows =
    await prisma.balanceProfile.findMany({
      select: {
        userId: true,
        scrimRankScore: true,
      },
      orderBy: [
        {
          scrimRankScore: "desc",
        },
        {
          updatedAt: "asc",
        },
      ],
    });

  const rankMap =
    new Map<string, number>();

  rankRows.forEach(
    (row, index) => {
      rankMap.set(
        row.userId,
        index + 1,
      );
    },
  );

  const players =
    (scrim.participants ?? []).map(
      (player, index) => ({
        id: index + 1,

        nickname:
          player.riotId ??
          `USER-${index + 1}`,

        profileIcon:
          profileIconUrl(
            player.profileIconId,
          ),

        mainChampionImage:
          undefined,

        subChampionImage:
          undefined,

        mainRole:
          player.mainPosition,

        subRole:
          player.subPosition,

        currentRank:
          tierText(
            player.currentTier,
            player.currentRank,
            player.currentLp,
          ),

        topRating:
          tierText(
            player.peakTier,
            player.peakRank,
            player.peakLp,
          ),

        tierEvaluation:
          player.tierEvaluation === null
            ? "-"
            : player.tierEvaluation.toFixed(1),

        recentWinRate:
          winRate(
            player.wins,
            player.losses,
          ),

        internalRanking:
          rankMap.get(
            player.userId,
          ) ?? 0,
      }),
    );

  return {
    code: scrim.code,
    title: scrim.code,

    matchType:
      matchTypeLabel(scrim.type),

    fearlessType:
      fearlessLabel(scrim.rule),

    status:
      lookupStatus(scrim.status),

    ruleTitle:
      fearlessLabel(scrim.rule),

    ruleDescription:
      "",

    players,
  };
}
