import { prisma } from "../../lib/prisma";
import { matchRules } from "../../data/matchRules";
import { redirect } from "next/navigation";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import MatchLookupTopBar from
  "../../components/matches/MatchLookupTopBar";

import MatchLookupResult from
  "../../components/matches/MatchLookupResult";

import {
  getScrimByCode,
} from "../../lib/scrims/service";

import type {
  MatchLookupData,
  MatchLookupStatus,
  MatchPlayer,
} from "../../data/matches";

import "./match-result.css";


type Props = {
  searchParams: Promise<{
    code?: string;
  }>;
};


function ruleLabel(rule: string) {
  switch (rule) {
    case "HARD_FEARLESS":
      return "하드 피어리스";

    case "SOFT_FEARLESS":
      return "소프트 피어리스";

    case "NO_BAN":
      return "노밴룰";

    case "BAN_FEARLESS":
      return "밴 피어리스";

    default:
      return rule;
  }
}


function statusLabel(
  status: string,
): MatchLookupStatus {
  switch (status) {
    case "OPEN":
      return "open";

    case "FINISHED":
    case "CANCELLED":
      return "finished";

    default:
      return "playing";
  }
}


function rankText(
  tier: string | null | undefined,
  rank: string | null | undefined,
  lp: number | null | undefined,
) {
  if (!tier) {
    return "언랭크";
  }

  const parts = [
    tier,
    rank,
  ].filter(Boolean);

  if (
    typeof lp === "number"
  ) {
    parts.push(`${lp}LP`);
  }

  return parts.join(" ");
}


function profileIconUrl(
  profileIconId:
    | number
    | null
    | undefined,
) {
  const id =
    profileIconId ?? 29;

  return (
    `https://ddragon.leagueoflegends.com/cdn/16.19.1/img/profileicon/${id}.png`
  );
}


function winRate(
  wins: number | null | undefined,
  losses: number | null | undefined,
) {
  const w = wins ?? 0;
  const l = losses ?? 0;

  const total = w + l;

  if (total <= 0) {
    return 0;
  }

  return Math.round(
    (w / total) * 100,
  );
}



function ruleKey(
  rule: string,
) {
  const map:
    Record<string, string> = {
      HARD_FEARLESS:
        "hard-fearless",
      SOFT_FEARLESS:
        "soft-fearless",
      NO_BAN:
        "no-ban",
      BAN_FEARLESS:
        "ban-fearless",
    };

  return map[rule] ?? "";
}



function championImageUrl(
  championName: string,
) {
  return (
    "https://ddragon.leagueoflegends.com/" +
    "cdn/16.19.1/img/champion/" +
    `${championName}.png`
  );
}


function getTopChampions(
  rows: any[],
  puuid: string,
) {
  const counts =
    new Map<string, number>();

  for (const row of rows) {

    const data =
      row.data as any;

    const me =
      data?.info?.participants?.find(
        (participant: any) =>
          participant.puuid === puuid
      );

    const championName =
      me?.championName;

    if (!championName) {
      continue;
    }

    counts.set(
      championName,
      (counts.get(championName) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .slice(0, 2)
    .map(
      ([name]) =>
        name
    );
}



function normalizePosition(
  value?: string | null,
) {
  const position =
    String(value ?? "")
      .trim()
      .toUpperCase();

  const map:
    Record<string, string> = {
      TOP: "TOP",
      JUNGLE: "JUNGLE",
      MIDDLE: "MID",
      MID: "MID",
      BOTTOM: "ADC",
      ADC: "ADC",
      UTILITY: "SUPPORT",
      SUPPORT: "SUPPORT",
    };

  return map[position] ?? null;
}


function getPlayedPositions(
  riotRows: any[],
  puuid: string,
  scrimRows: any[],
) {
  const counts =
    new Map<string, number>();


  const add = (
    position?: string | null,
    weight = 1,
  ) => {
    const normalized =
      normalizePosition(position);

    if (!normalized) {
      return;
    }

    counts.set(
      normalized,
      (counts.get(normalized) ?? 0) +
        weight,
    );
  };


  /*
    솔로랭크 실제 플레이 포지션

    Riot teamPosition을 기준으로 계산.
    실제 게임 데이터이므로 내전 신청값보다
    조금 더 강하게 반영.
  */
  for (const row of riotRows) {

    const data =
      row.data as any;

    const me =
      data?.info?.participants?.find(
        (participant: any) =>
          participant.puuid === puuid
      );

    if (!me) {
      continue;
    }

    add(
      me.teamPosition ||
      me.individualPosition,
      2,
    );
  }


  /*
    지금까지의 내전 신청 포지션

    ANY는 normalizePosition에서 자동 제외.
    주포는 2점, 부포는 1점.
  */
  for (const row of scrimRows) {

    add(
      row.mainPosition,
      2,
    );

    add(
      row.subPosition,
      1,
    );
  }


  const sorted =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .map(
        ([position]) =>
          position
      );


  return {
    main:
      sorted[0] ?? "-",

    sub:
      sorted[1] ?? "-",
  };
}


export default async function MatchResultPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const code =
    String(params.code ?? "")
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();


  if (
    !/^([NR])\d{1,6}$/.test(code)
  ) {
    redirect("/matches");
  }


  const scrim =
    await getScrimByCode(code);


  if (!scrim) {
    redirect("/matches");
  }


  const participants =
    scrim.participants ?? [];


  /*
    내전랭킹
    - scrimRankScore 높은 순
    - 같은 점수는 같은 순위
  */
  const rankingRows =
    await prisma.balanceProfile.findMany({
      orderBy: [
        {
          scrimRankScore:
            "desc",
        },
        {
          updatedAt:
            "asc",
        },
      ],

      select: {
        userId: true,
        scrimRankScore: true,
      },
    });


  const internalRankMap =
    new Map<string, number>();

  let previousScore:
    number | null = null;

  let previousRank = 0;

  rankingRows.forEach(
    (row, index) => {

      const score =
        Number(
          row.scrimRankScore ?? 0
        );

      const rank =
        previousScore !== null &&
        score === previousScore
          ? previousRank
          : index + 1;

      internalRankMap.set(
        row.userId,
        rank,
      );

      previousScore =
        score;

      previousRank =
        rank;
    }
  );


  /*
    각 참가자의 RiotMatchCache에서
    실제 플레이 횟수 TOP2 챔피언 계산
  */
  const championMap =
    new Map<
      string,
      string[]
    >();


  const positionMap =
    new Map<
      string,
      {
        main: string;
        sub: string;
      }
    >();


  const recentWinRateMap =
    new Map<
      string,
      number
    >();


  await Promise.all(
    participants.map(
      async (player: any) => {

        if (!player.puuid) {
          return;
        }

        const [
          rows,
          soloRows,
          scrimPositionRows,
        ] =
          await Promise.all([

            /*
              챔피언 TOP2용 전체 협곡 전적
            */
            prisma.riotMatchCache.findMany({
              where: {
                puuid:
                  player.puuid,

                queueId: {
                  in: [
                    400,
                    420,
                    430,
                    440,
                    490,
                  ],
                },
              },

              orderBy: {
                gameCreation:
                  "desc",
              },

              select: {
                data: true,
              },
            }),


            /*
              포지션 계산용 솔로랭크만
            */
            prisma.riotMatchCache.findMany({
              where: {
                puuid:
                  player.puuid,

                queueId:
                  420,
              },

              orderBy: {
                gameCreation:
                  "desc",
              },

              take: 100,

              select: {
                data: true,
              },
            }),


            /*
              해당 유저가 지금까지 참가한
              내전 포지션 데이터
            */
            prisma.scrimParticipant.findMany({
              where: {
                userId:
                  player.userId,

                status: {
                  in: [
                    "CONFIRMED",
                    "WAITING",
                  ],
                },
              },

              orderBy: {
                joinedAt:
                  "desc",
              },

              take: 100,

              select: {
                mainPosition: true,
                subPosition: true,
              },
            }),

          ]);


        championMap.set(
          player.puuid,
          getTopChampions(
            rows,
            player.puuid,
          ),
        );


        /*
          최근승률:
          Riot 캐시 최신순 최대 20경기에서
          실제 participant.win 기준으로 계산.

          내전 UserStats wins/losses는 사용하지 않는다.
        */
        const recent20 =
          rows.slice(0, 20);

        let recentWins = 0;
        let recentGames = 0;

        for (const row of recent20) {
          const match =
            row.data as any;

          const me =
            match?.info?.participants?.find(
              (participant: any) =>
                participant.puuid ===
                player.puuid,
            );

          if (!me) {
            continue;
          }

          recentGames += 1;

          if (me.win === true) {
            recentWins += 1;
          }
        }

        recentWinRateMap.set(
          player.puuid,
          recentGames > 0
            ? Math.round(
                (
                  recentWins /
                  recentGames
                ) * 100,
              )
            : -1,
        );


        positionMap.set(
          player.userId,
          getPlayedPositions(
            soloRows,
            player.puuid,
            scrimPositionRows,
          ),
        );
      }
    )
  );


  const players: MatchPlayer[] =
    participants.map(
      (player: any, index: number) => ({
        id: index + 1,

        nickname:
          player.riotId ??
          `참가자 ${index + 1}`,

        gameName:
          player.gameName ??
          null,

        tagLine:
          player.tagLine ??
          null,

        profileIcon:
          profileIconUrl(
            player.profileIconId,
          ),

        mainChampionImage:
          player.puuid &&
          championMap.get(
            player.puuid
          )?.[0]
            ? championImageUrl(
                championMap.get(
                  player.puuid
                )![0]
              )
            : undefined,

        subChampionImage:
          player.puuid &&
          championMap.get(
            player.puuid
          )?.[1]
            ? championImageUrl(
                championMap.get(
                  player.puuid
                )![1]
              )
            : undefined,

        mainRole:
          positionMap.get(
            player.userId
          )?.main === "ADC"
            ? "AD"
            : (
                positionMap.get(
                  player.userId
                )?.main ?? "-"
              ),

        subRole:
          positionMap.get(
            player.userId
          )?.sub === "ADC"
            ? "AD"
            : (
                positionMap.get(
                  player.userId
                )?.sub ?? "-"
              ),

        currentRank:
          rankText(
            player.currentTier,
            player.currentRank,
            player.currentLp,
          ),

        topRating:
          rankText(
            player.peakTier,
            player.peakRank,
            player.peakLp,
          ),

        tierEvaluation:
          player.tierEvaluation !==
            null &&
          player.tierEvaluation !==
            undefined
            ? String(
                player.tierEvaluation,
              )
            : "-",

        recentWinRate:
          player.puuid
            ? (
                recentWinRateMap.get(
                  player.puuid,
                ) ?? -1
              )
            : -1,

        internalRanking:
          internalRankMap.get(
            player.userId
          ) ?? 0,
      }),
    );


  const match:
    MatchLookupData = {
      code:
        scrim.code,

      title:
        scrim.code,

      matchType:
        scrim.type === "RANKED"
          ? "랭크내전"
          : "일반내전",

      fearlessType:
        ruleLabel(
          scrim.rule,
        ) as MatchLookupData["fearlessType"],

      status:
        statusLabel(
          scrim.status,
        ),

      ruleTitle:
        ruleLabel(
          scrim.rule,
        ),

      ruleKey:
        ruleKey(
          scrim.rule,
        ),

      ruleDescription:
        matchRules.find(
          (rule) =>
            rule.title ===
            ruleLabel(scrim.rule)
        )?.description ?? "",

      players,
    };


  return (
    <main className="match-lookup-page">

      <Header active="matches" />

      <MatchLookupTopBar
        match={match}
      />

      <MatchLookupResult
        match={match}
      />

      <Footer />

    </main>
  );
}
