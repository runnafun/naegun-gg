import { prisma } from "./prisma";

import type {
  RiotMatchDto,
  RiotMatchParticipant,
} from "./riot";

import {
  INTERNAL_RANK_IMAGES,
  SOLO_TIER_IMAGES,
  type InternalRank,
  type MatchHistoryItem,
  type MatchPlayer,
  type MatchTeamPlayer,
  type ProfileChampion,
  type ProfileData,
  type ProfileSearchResult,
  type SoloTierKey,
} from "../data/profile";


const DDRAGON_VERSION =
  "16.19.1";

const DDRAGON =
  `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img`;

const RANK_ORDER:
  InternalRank[] = [
    "F",
    "E",
    "D",
    "C",
    "B",
    "A",
    "S",
  ];

const SHIELDS_PER_RANK =
  20;


/* ==================================================
   IMAGE
================================================== */

function profileIconUrl(
  id: number | null | undefined,
) {
  return `${DDRAGON}/profileicon/${id ?? 29}.png`;
}


function championUrl(
  name: string,
) {
  return `${DDRAGON}/champion/${name}.png`;
}


function itemUrl(
  id: number,
) {
  return `${DDRAGON}/item/${id}.png`;
}


const SPELL_NAMES:
  Record<number, string> = {
    1: "SummonerBoost",
    3: "SummonerExhaust",
    4: "SummonerFlash",
    6: "SummonerHaste",
    7: "SummonerHeal",
    11: "SummonerSmite",
    12: "SummonerTeleport",
    13: "SummonerMana",
    14: "SummonerDot",
    21: "SummonerBarrier",
  };


function spellUrl(
  id: number,
) {
  const name =
    SPELL_NAMES[id] ??
    "SummonerFlash";

  return `${DDRAGON}/spell/${name}.png`;
}


/* ==================================================
   BASIC
================================================== */

function normalize(
  value: string,
) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}


function normalizeTier(
  tier:
    | string
    | null
    | undefined,
): SoloTierKey {
  const value =
    String(tier ?? "")
      .trim()
      .toUpperCase();

  const allowed:
    SoloTierKey[] = [
      "CHALLENGER",
      "GRANDMASTER",
      "MASTER",
      "DIAMOND",
      "EMERALD",
      "PLATINUM",
      "GOLD",
      "SILVER",
      "BRONZE",
      "IRON",
    ];

  return allowed.includes(
    value as SoloTierKey,
  )
    ? value as SoloTierKey
    : "IRON";
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
    wins /
    total *
    100,
  );
}


function updatedText(
  date:
    | Date
    | null
    | undefined,
) {
  if (!date) {
    return "갱신 기록 없음";
  }

  const diff =
    Math.max(
      0,
      Date.now() -
      date.getTime(),
    );

  const minutes =
    Math.floor(
      diff / 60000,
    );

  if (minutes < 1) {
    return "방금 갱신";
  }

  if (minutes < 60) {
    return `갱신 ${minutes}분 전`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `갱신 ${hours}시간 전`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `갱신 ${days}일 전`;
}


function positionLabel(
  value:
    | string
    | null
    | undefined,
) {
  switch (value) {
    case "TOP":
      return "탑";

    case "JUNGLE":
      return "정글";

    case "MID":
      return "미드";

    case "ADC":
      return "원딜";

    case "SUPPORT":
      return "서포터";

    default:
      return "상관없음";
  }
}


/* ==================================================
   INTERNAL RANK SHIELD
================================================== */

function getInternalRank(
  progress: number,
) {
  const safe =
    Math.max(
      0,
      Math.floor(progress),
    );

  const index =
    Math.min(
      Math.floor(
        safe /
        SHIELDS_PER_RANK,
      ),
      RANK_ORDER.length - 1,
    );

  const rank =
    RANK_ORDER[index];

  const filled =
    rank === "S"
      ? Math.min(
          safe -
          (
            RANK_ORDER.length -
            1
          ) *
          SHIELDS_PER_RANK,
          SHIELDS_PER_RANK,
        )
      : safe %
        SHIELDS_PER_RANK;

  return {
    rank,

    filled:
      Math.max(
        0,
        filled,
      ),

    total:
      SHIELDS_PER_RANK,
  };
}


/* ==================================================
   MATCH HELPERS
================================================== */

function participantName(
  p: RiotMatchParticipant,
) {
  if (
    p.riotIdGameName &&
    p.riotIdTagline
  ) {
    return `${p.riotIdGameName}#${p.riotIdTagline}`;
  }

  return (
    p.riotIdGameName ??
    "Unknown"
  );
}


function durationText(
  seconds: number,
) {
  const min =
    Math.floor(
      seconds / 60,
    );

  const sec =
    seconds % 60;

  return `${min}:${String(sec).padStart(2, "0")}`;
}


function agoText(
  time: number,
) {
  const diff =
    Date.now() - time;

  const minutes =
    Math.max(
      1,
      Math.floor(
        diff / 60000,
      ),
    );

  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `${days}일 전`;
}


function queueLabel(
  queueId: number,
) {
  switch (queueId) {
    case 420:
      return "솔로랭크";

    case 440:
      return "자유랭크";

    case 400:
    case 430:
      return "일반";

    case 450:
      return "칼바람";

    case 490:
      return "빠른 대전";

    default:
      return "리그 오브 레전드";
  }
}


function participantItems(
  p: RiotMatchParticipant,
) {
  return [
    p.item0,
    p.item1,
    p.item2,
    p.item3,
    p.item4,
    p.item5,
  ]
    .filter(
      (id) => id > 0,
    )
    .map(itemUrl);
}


function miniPlayer(
  p: RiotMatchParticipant,
  me: string,
): MatchPlayer {
  return {
    name:
      participantName(p),

    championImage:
      championUrl(
        p.championName,
      ),

    level:
      p.champLevel,

    kda:
      `${p.kills}/${p.deaths}/${p.assists}`,

    isMe:
      p.puuid === me,
  };
}


function detailPlayer(
  p: RiotMatchParticipant,
): MatchTeamPlayer {
  const kda =
    (
      p.kills +
      p.assists
    ) /
    Math.max(
      p.deaths,
      1,
    );

  return {
    name:
      participantName(p),

    championImage:
      championUrl(
        p.championName,
      ),

    level:
      p.champLevel,

    opScore:
      Number(
        kda.toFixed(1),
      ),

    kills:
      p.kills,

    deaths:
      p.deaths,

    assists:
      p.assists,

    damage:
      p.totalDamageDealtToChampions,

    wards:
      `${p.wardsPlaced}/${p.wardsKilled}`,

    cs:
      p.totalMinionsKilled +
      p.neutralMinionsKilled,

    items:
      participantItems(p),
  };
}


function buildHistory(
  matches:
    RiotMatchDto[],
  puuid: string,
): MatchHistoryItem[] {
  return matches.flatMap(
    (match, index) => {
      const me =
        match.info.participants.find(
          (p) =>
            p.puuid === puuid,
        );

      if (!me) {
        return [];
      }

      const team =
        match.info.participants.filter(
          (p) =>
            p.teamId ===
            me.teamId,
        );

      const enemy =
        match.info.participants.filter(
          (p) =>
            p.teamId !==
            me.teamId,
        );

      const teamKills =
        team.reduce(
          (sum, p) =>
            sum + p.kills,
          0,
        );

      const blue =
        match.info.participants.filter(
          (p) =>
            p.teamId === 100,
        );

      const red =
        match.info.participants.filter(
          (p) =>
            p.teamId === 200,
        );

      const blueKills =
        blue.reduce(
          (sum, p) =>
            sum + p.kills,
          0,
        );

      const redKills =
        red.reduce(
          (sum, p) =>
            sum + p.kills,
          0,
        );

      const blueGold =
        blue.reduce(
          (sum, p) =>
            sum + p.goldEarned,
          0,
        );

      const redGold =
        red.reduce(
          (sum, p) =>
            sum + p.goldEarned,
          0,
        );

      const cs =
        me.totalMinionsKilled +
        me.neutralMinionsKilled;

      const minutes =
        Math.max(
          match.info.gameDuration /
          60,
          1,
        );

      const kp =
        teamKills > 0
          ? Math.round(
              (
                me.kills +
                me.assists
              ) /
              teamKills *
              100,
            )
          : 0;

      const kda =
        (
          me.kills +
          me.assists
        ) /
        Math.max(
          me.deaths,
          1,
        );

      return [{
        id:
          index + 1,

        result:
          me.win
            ? "win"
            : "lose",

        queue:
          queueLabel(
            match.info.queueId,
          ),

        queueId:
          match.info.queueId,

        ago:
          agoText(
            match.info.gameCreation,
          ),

        duration:
          durationText(
            match.info.gameDuration,
          ),

        champion:
          me.championName,

        championImage:
          championUrl(
            me.championName,
          ),

        championLevel:
          me.champLevel,

        spells: [
          spellUrl(
            me.summoner1Id,
          ),
          spellUrl(
            me.summoner2Id,
          ),
        ],

        runes: [],

        kills:
          me.kills,

        deaths:
          me.deaths,

        assists:
          me.assists,

        rating:
          kda.toFixed(2),

        killParticipation:
          kp,

        laneScore: 0,

        cs,

        csPerMinute:
          Number(
            (
              cs /
              minutes
            ).toFixed(1),
          ),

        items:
          participantItems(me),

        trinket:
          itemUrl(
            me.item6 || 3340,
          ),

        allies:
          team.map(
            (p) =>
              miniPlayer(
                p,
                puuid,
              ),
          ),

        enemies:
          enemy.map(
            (p) =>
              miniPlayer(
                p,
                puuid,
              ),
          ),

        detail: {
          blueKills,
          redKills,

          blueGold,
          redGold,

          blueTeam:
            blue.map(
              detailPlayer,
            ),

          redTeam:
            red.map(
              detailPlayer,
            ),
        },
      }];
    },
  );
}


/* ==================================================
   CHAMPION STATS
================================================== */

function championStats(
  matches:
    RiotMatchDto[],
  puuid: string,
  limit = 3,
): ProfileChampion[] {
  const map =
    new Map<
      string,
      {
        games: number;
        wins: number;
      }
    >();

  for (const match of matches) {
    const me =
      match.info.participants.find(
        (p) =>
          p.puuid === puuid,
      );

    if (!me) {
      continue;
    }

    const current =
      map.get(
        me.championName,
      ) ?? {
        games: 0,
        wins: 0,
      };

    current.games += 1;

    if (me.win) {
      current.wins += 1;
    }

    map.set(
      me.championName,
      current,
    );
  }

  return Array
    .from(
      map.entries(),
    )
    .sort(
      (a, b) =>
        b[1].games -
        a[1].games,
    )
    .slice(
      0,
      limit,
    )
    .map(
      ([name, stat]) => ({
        name,

        image:
          championUrl(name),

        games:
          stat.games,

        winRate:
          winRate(
            stat.wins,
            stat.games -
            stat.wins,
          ),
      }),
    );
}


/* ==================================================
   PERFORMANCE
================================================== */

function performanceStats(
  matches:
    RiotMatchDto[],
  puuid: string,
) {
  const mine =
    matches
      .map(
        (match) => {
          const me =
            match.info.participants.find(
              (p) =>
                p.puuid ===
                puuid,
            );

          if (!me) {
            return null;
          }

          const team =
            match.info.participants.filter(
              (p) =>
                p.teamId ===
                me.teamId,
            );

          const teamKills =
            team.reduce(
              (sum, p) =>
                sum + p.kills,
              0,
            );

          return {
            win:
              me.win,

            kda:
              (
                me.kills +
                me.assists
              ) /
              Math.max(
                me.deaths,
                1,
              ),

            kp:
              teamKills
                ? (
                    me.kills +
                    me.assists
                  ) /
                  teamKills *
                  100
                : 0,

            duration:
              match.info.gameDuration,
          };
        },
      )
      .filter(
        (x):
          x is NonNullable<typeof x> =>
            x !== null,
      );

  if (!mine.length) {
    return {
      winRate: 0,
      winRateDelta: 0,

      averageKda: 0,
      averageKdaDelta: 0,

      killParticipation: 0,
      killParticipationDelta: 0,

      averageGameTime:
        "0:00",

      averageGameTimeDelta:
        "0:00",
    };
  }

  const wins =
    mine.filter(
      (x) => x.win,
    ).length;

  const avgKda =
    mine.reduce(
      (sum, x) =>
        sum + x.kda,
      0,
    ) /
    mine.length;

  const avgKp =
    mine.reduce(
      (sum, x) =>
        sum + x.kp,
      0,
    ) /
    mine.length;

  const avgDuration =
    Math.round(
      mine.reduce(
        (sum, x) =>
          sum + x.duration,
        0,
      ) /
      mine.length,
    );

  return {
    winRate:
      winRate(
        wins,
        mine.length - wins,
      ),

    winRateDelta: 0,

    averageKda:
      Number(
        avgKda.toFixed(2),
      ),

    averageKdaDelta: 0,

    killParticipation:
      Math.round(avgKp),

    killParticipationDelta: 0,

    averageGameTime:
      durationText(
        avgDuration,
      ),

    averageGameTimeDelta:
      "0:00",
  };
}


/* ==================================================
   ACTIVITY
================================================== */

function activityStats(
  matches:
    RiotMatchDto[],
  puuid: string,
) {
  const dayLabels = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ];

  const days =
    dayLabels.map(
      (label) => ({
        label,
        games: 0,
      }),
    );

  const hours =
    [
      {
        label: "00~03시",
        games: 0,
        wins: 0,
      },
      {
        label: "04~07시",
        games: 0,
        wins: 0,
      },
      {
        label: "08~11시",
        games: 0,
        wins: 0,
      },
      {
        label: "12~15시",
        games: 0,
        wins: 0,
      },
      {
        label: "16~19시",
        games: 0,
        wins: 0,
      },
      {
        label: "20~23시",
        games: 0,
        wins: 0,
      },
    ];

  for (const match of matches) {
    const me =
      match.info.participants.find(
        (p) =>
          p.puuid === puuid,
      );

    if (!me) {
      continue;
    }

    const date =
      new Date(
        match.info.gameCreation,
      );

    const day =
      date.getDay();

    days[day].games += 1;

    const hour =
      date.getHours();

    const bucket =
      Math.floor(
        hour / 4,
      );

    hours[bucket].games += 1;

    if (me.win) {
      hours[bucket].wins += 1;
    }
  }

  return {
    days,

    hours:
      hours.map(
        (item) => ({
          label:
            item.label,

          games:
            item.games,

          winRate:
            winRate(
              item.wins,
              item.games -
              item.wins,
            ),
        }),
      ),
  };
}


/* ==================================================
   SEARCH
================================================== */

export async function searchProfiles(
  query: string,
): Promise<ProfileSearchResult[]> {
  const keyword =
    normalize(query);

  if (!keyword) {
    return [];
  }

  const hashIndex =
    keyword.indexOf("#");

  const gameName =
    hashIndex >= 0
      ? keyword.slice(
          0,
          hashIndex,
        )
      : keyword;

  const tagLine =
    hashIndex >= 0
      ? keyword.slice(
          hashIndex + 1,
        )
      : "";

  const accounts =
    await prisma.riotAccount.findMany({
      where: {
        user: {
          status: {
            not: "DELETED",
          },
        },

        ...(tagLine
          ? {
              AND: [
                {
                  gameName: {
                    contains:
                      gameName,
                    mode:
                      "insensitive",
                  },
                },
                {
                  tagLine: {
                    contains:
                      tagLine,
                    mode:
                      "insensitive",
                  },
                },
              ],
            }
          : {
              gameName: {
                contains:
                  gameName,
                mode:
                  "insensitive",
              },
            }),
      },

      include: {
        user: {
          include: {
            defenseStats: true,
          },
        },
      },

      take: 8,

      orderBy: {
        updatedAt: "desc",
      },
    });

  return accounts.map(
    (account) => {
      const internal =
        getInternalRank(
          account.user
            .defenseStats
            ?.progress ?? 0,
        );

      return {
        puuid:
          account.puuid,

        gameName:
          account.gameName,

        tagLine:
          account.tagLine,

        profileIcon:
          profileIconUrl(
            account.profileIconId,
          ),

        level: 0,

        soloTier:
          account.soloTier ??
          "UNRANKED",

        soloRank:
          account.soloRank ??
          "",

        soloLp:
          account.soloLp ??
          0,

        internalRank:
          internal.rank,
      };
    },
  );
}


/* ==================================================
   GET PROFILE
================================================== */


function favoriteLineFromMatches(
  matches: any[],
  puuid: string,
) {
  const counts:
    Record<string, number> = {};

  for (const match of matches) {
    const me =
      match.info?.participants?.find(
        (participant: any) =>
          participant.puuid === puuid
      );

    if (!me) {
      continue;
    }

    const position =
      me.teamPosition ||
      me.individualPosition ||
      "";

    if (
      !position ||
      position === "INVALID"
    ) {
      continue;
    }

    counts[position] =
      (counts[position] ?? 0) + 1;
  }

  const top =
    Object.entries(counts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0]?.[0];

  const labels:
    Record<string, string> = {
      TOP: "탑",
      JUNGLE: "정글",
      MIDDLE: "미드",
      BOTTOM: "원딜",
      UTILITY: "서폿",
    };

  return (
    labels[top] ??
    "-"
  );
}


export async function getProfileByRiotId(
  gameName: string,
  tagLine: string,
): Promise<ProfileData | null> {
  const account =
    await prisma.riotAccount.findFirst({
      where: {
        gameName: {
          equals:
            gameName.trim(),
          mode:
            "insensitive",
        },

        tagLine: {
          equals:
            tagLine.trim(),
          mode:
            "insensitive",
        },

        user: {
          status: {
            not: "DELETED",
          },
        },
      },

      include: {
        user: {
          include: {
            preferences: true,
            stats: true,
            defenseStats: true,
            balanceProfile: true,
          },
        },
      },
    });

  if (!account) {
    return null;
  }


  const defenseStats =
    await prisma.defenseStats.findUnique({
      where: {
        userId:
          account.userId,
      },
    });



  /*
    프로필 페이지에서는 Riot API를 호출하지 않습니다.
    저장된 RDS 캐시만 사용합니다.
  */
  /*
    화면에 보여줄 최근 전적.
    UI에는 최대 20경기만 사용한다.
  */
  const cachedMatches =
    await prisma.riotMatchCache.findMany({
      where: {
        puuid:
          account.puuid,

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

    });


  /*
    시즌 챔피언 통계용 데이터.

    화면의 최근 20경기와 분리한다.
    RDS에 지금까지 누적된 솔랭/자랭 경기 전체를 사용한다.
  */
  const seasonRankRows =
    await prisma.riotMatchCache.findMany({
      where: {
        puuid:
          account.puuid,

        queueId: {
          in: [
            420,
            440,
          ],
        },
      },

      orderBy: {
        gameCreation:
          "desc",
      },
    });

  const seasonRankMatches =
    seasonRankRows.map(
      (row) =>
        row.data as unknown as RiotMatchDto
    );


  const riotMatches:
    RiotMatchDto[] =
    cachedMatches.map(
      (row) =>
        row.data as unknown as RiotMatchDto
    );


  const user =
    account.user;

  const stats =
    user.stats;

  const defense =
    user.defenseStats;

  const balance =
    user.balanceProfile;


  const internal =
    getInternalRank(
      defense?.progress ?? 0,
    );


  const liveSolo =
    account.soloTier
      ? {
          tier:
            account.soloTier,

          rank:
            account.soloRank ?? "",

          lp:
            account.soloLp ?? 0,

          wins: 0,
          losses: 0,
        }
      : null;

  const currentSoloTier =
    liveSolo?.tier ??
    account.soloTier ??
    null;

  const currentSoloRank =
    liveSolo?.rank ??
    account.soloRank ??
    null;

  const currentSoloLp =
    liveSolo?.lp ??
    account.soloLp ??
    0;


    const currentFlexTier =
    account.flexTier ??
    null;

  const currentFlexRank =
    account.flexRank ??
    null;

  const currentFlexLp =
    account.flexLp ??
    0;


const soloTierKey =
    normalizeTier(
      currentSoloTier,
    );

  const peakTierKey =
    normalizeTier(
      balance?.peakTier ??
      currentSoloTier,
    );


  const wins =
    stats?.wins ?? 0;

  const losses =
    stats?.losses ?? 0;


  const internalRankPosition =
    balance
      ? (
          await prisma.balanceProfile.count({
            where: {
              scrimRankScore: {
                gt:
                  balance.scrimRankScore,
              },
            },
          })
        ) + 1
      : 0;


  const recent10 =
    riotMatches.slice(
      0,
      10,
    );

  const activity =
    activityStats(
      riotMatches,
      account.puuid,
    );


  return {
    puuid:
      account.puuid,

    gameName:
      account.gameName,

    tagLine:
      account.tagLine,

    level:
      account.summonerLevel ?? 0,

    profileIcon:
      profileIconUrl(
        account.profileIconId,
      ),


    internalRank:
      internal.rank,

    internalRankImage:
      INTERNAL_RANK_IMAGES[
        internal.rank
      ],

    internalScore:
      `${internal.rank} (${internal.filled}/${internal.total})`,

    internalRankPosition,

    internalRankWins:
      internal.filled,

    internalRankTotal:
      internal.total,

    defenseProgress:
      Math.min(
        Math.max(
          defenseStats?.progress ?? 0,
          0,
        ),
        100,
      ),

    defenseTickets:
      Math.min(
        Math.max(
          defenseStats?.tickets ?? 0,
          0,
        ),
        2,
      ),


    soloTier:
      currentSoloTier ??
      "UNRANKED",

    soloTierKey,

    soloTierImage:
      SOLO_TIER_IMAGES[
        soloTierKey
      ],

    soloRank:
      currentSoloRank ??
      "",

    soloLp:
      currentSoloLp,


    peakTier:
      balance?.peakTier ??
      currentSoloTier ??
      "UNRANKED",

    peakTierKey,

    peakTierImage:
      SOLO_TIER_IMAGES[
        peakTierKey
      ],

    peakLp:
      balance?.peakLp ??
      currentSoloLp,


    customWinRate:
      winRate(
        wins,
        losses,
      ),

    soloWinRate:
      (
        (account.soloWins ?? 0) +
        (account.soloLosses ?? 0)
      ) > 0
        ? winRate(
            account.soloWins ?? 0,
            account.soloLosses ?? 0,
          )
        : -1,

    flexTier:
      currentFlexTier ??
      "UNRANKED",

    flexRank:
      currentFlexRank ??
      "",

    flexLp:
      currentFlexLp,

    flexWinRate:
      (
        (account.flexWins ?? 0) +
        (account.flexLosses ?? 0)
      ) > 0
        ? winRate(
            account.flexWins ?? 0,
            account.flexLosses ?? 0,
          )
        : -1,

    soloMostChampions:
      championStats(
        seasonRankMatches.filter(
          (match) =>
            match.info.queueId ===
            420,
        ),
        account.puuid,
        10,
      ),

    flexMostChampions:
      championStats(
        seasonRankMatches.filter(
          (match) =>
            match.info.queueId ===
            440,
        ),
        account.puuid,
        10,
      ),





    favoriteLine:
      favoriteLineFromMatches(
        riotMatches,
        account.puuid,
      ),

    lastUpdatedText:
      updatedText(
        account.lastSyncedAt,
      ),


    mostChampions:
      championStats(
        seasonRankMatches.filter(
          (match) =>
            match.info.queueId ===
            420,
        ),
        account.puuid,
        10,
      ),

    recentChampions:
      championStats(
        recent10.filter(
          (match) =>
            match.info.queueId ===
              420 ||
            match.info.queueId ===
              440,
        ),
        account.puuid,
        3,
      ),


    performance:
      performanceStats(
        riotMatches,
        account.puuid,
      ),


    activityDays:
      activity.days,

    activityHours:
      activity.hours,


    matches:
      buildHistory(
        riotMatches,
        account.puuid,
      ),
  };
}
