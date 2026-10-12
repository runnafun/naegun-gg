
import { prisma } from "./prisma";
import { championNameKo } from "../data/champion-ko";

export type HomePosition =
  "top" | "jungle" | "mid" | "adc" | "support";

export type ChampionPick = [
  name: string,
  percent: string,
  championId: string
];

export type HomeChampionPreference =
  Record<HomePosition, ChampionPick[]>;

export type WeeklyFrequencyItem = {
  day: string;
  value: number;
};

const POSITIONS: HomePosition[] = [
  "top", "jungle", "mid", "adc", "support"
];

const LANE_MAP: Record<string, HomePosition> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "mid",
  BOTTOM: "adc",
  UTILITY: "support",
};

const KST = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export async function getHomeStatistics(): Promise<{
  championPreference: HomeChampionPreference;
  sampleGames: number;
  weeklyFrequency: WeeklyFrequencyItem[];
}> {
  // 최근 7일의 한국시간 날짜 계산
  const nowKst = new Date(Date.now() + KST);

  const midnightUtc = Date.UTC(
    nowKst.getUTCFullYear(),
    nowKst.getUTCMonth(),
    nowKst.getUTCDate()
  ) - KST;

  const startUtc = midnightUtc - 6 * DAY;

  // Riot API 호출 없이 RDS에 저장된 경기 활용
  const [matchRows, scrimRows] = await Promise.all([
    prisma.riotMatchCache.findMany({
      where: {
        queueId: 420,
      },
      orderBy: {
        gameCreation: "desc",
      },
      take: 200,
      select: {
        data: true,
      },
    }),

    prisma.scrim.findMany({
      where: {
        createdAt: {
          gte: new Date(startUtc),
        },
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  // 포지션별 챔피언 픽 수
  const counts: Record<
    HomePosition, Map<string, number>
  > = {
    top: new Map(),
    jungle: new Map(),
    mid: new Map(),
    adc: new Map(),
    support: new Map(),
  };

  const totals: Record<HomePosition, number> = {
    top: 0,
    jungle: 0,
    mid: 0,
    adc: 0,
    support: 0,
  };

  let sampleGames = 0;

  for (const row of matchRows) {
    const match = row.data as unknown as {
      info?: {
        queueId?: number;
        gameDuration?: number;
        participants?: Array<{
          championName?: string;
          teamPosition?: string;
        }>;
      };
    };

    const info = match?.info;

    // 5분 미만, 잘못된 경기 제외
    if (
      info?.queueId !== 420 ||
      (info.gameDuration ?? 0) < 300 ||
      !Array.isArray(info.participants) ||
      info.participants.length !== 10
    ) {
      continue;
    }

    sampleGames++;

    for (const participant of info.participants) {
      const pos =
        LANE_MAP[participant.teamPosition ?? ""];

      const champion =
        participant.championName ?? "";

      if (
        !pos ||
        !/^[A-Za-z0-9]+$/.test(champion)
      ) {
        continue;
      }

      counts[pos].set(
        champion,
        (counts[pos].get(champion) ?? 0) + 1
      );

      totals[pos]++;
    }
  }

  const championPreference: HomeChampionPreference = {
    top: [],
    jungle: [],
    mid: [],
    adc: [],
    support: [],
  };

  for (const pos of POSITIONS) {
    championPreference[pos] =
      [...counts[pos].entries()]
        .sort(
          (a, b) =>
            b[1] - a[1] ||
            a[0].localeCompare(b[0])
        )
        .slice(0, 10)
        .map(
          ([id, count]): ChampionPick => [
            championNameKo(id),
            `${(
              count / totals[pos] * 100
            ).toFixed(1)}%`,
            id,
          ]
        );
  }

  // 최근 7일 내전 생성 빈도
  const weekNames = [
    "일", "월", "화", "수", "목", "금", "토"
  ];

  const dates = Array.from(
    { length: 7 },
    (_, i) => {
      const local = new Date(
        startUtc + i * DAY + KST
      );

      return {
        key: local.toISOString().slice(0, 10),
        day: weekNames[local.getUTCDay()],
        value: 0,
      };
    }
  );

  const byDate = new Map(
    dates.map((v) => [v.key, v])
  );

  for (const scrim of scrimRows) {
    const key = new Date(
      scrim.createdAt.getTime() + KST
    ).toISOString().slice(0, 10);

    const day = byDate.get(key);

    if (day) {
      day.value++;
    }
  }

  return {
    championPreference,
    sampleGames,
    weeklyFrequency: dates.map(
      ({ day, value }) => ({
        day,
        value,
      })
    ),
  };
}
