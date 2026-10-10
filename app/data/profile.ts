export type InternalRank =
  | "S"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F";

export type SoloTierKey =
  | "CHALLENGER"
  | "GRANDMASTER"
  | "MASTER"
  | "DIAMOND"
  | "EMERALD"
  | "PLATINUM"
  | "GOLD"
  | "SILVER"
  | "BRONZE"
  | "IRON";


/* ==================================================
   SEARCH
================================================== */

export type ProfileSearchResult = {
  puuid: string;

  gameName: string;
  tagLine: string;

  profileIcon: string;
  level: number;

  soloTier: string;
  soloRank: string;
  soloLp: number;

  internalRank: InternalRank;
};


/* ==================================================
   CHAMPION
================================================== */

export type ProfileChampion = {
  name: string;
  image: string;

  winRate: number;
  games: number;
};


/* ==================================================
   PLAYER
================================================== */

export type MatchPlayer = {
  name: string;

  championImage: string;

  level: number;

  kda: string;

  isMe?: boolean;
};


/* ==================================================
   TEAM DETAIL
================================================== */

export type MatchTeamPlayer = {
  name: string;

  championImage: string;

  level: number;

  opScore: number;

  badge?: string;

  kills: number;
  deaths: number;
  assists: number;

  damage: number;

  wards: string;

  cs: number;

  items: string[];
};


export type MatchDetail = {
  blueKills: number;
  redKills: number;

  blueGold: number;
  redGold: number;

  blueTeam: MatchTeamPlayer[];
  redTeam: MatchTeamPlayer[];
};


/* ==================================================
   MATCH
================================================== */

export type MatchHistoryItem = {
  id: number;

  result: "win" | "lose";

  queue: string;

  queueId?: number;

  ago: string;

  duration: string;

  champion: string;
  championImage: string;

  championLevel: number;

  spells: string[];
  runes: string[];

  kills: number;
  deaths: number;
  assists: number;

  rating: string;

  killParticipation: number;

  laneScore: number;

  cs: number;
  csPerMinute: number;

  items: string[];

  trinket: string;

  allies: MatchPlayer[];

  enemies: MatchPlayer[];

  detail: MatchDetail;
};


/* ==================================================
   PERFORMANCE
================================================== */

export type PerformanceData = {
  winRate: number;
  winRateDelta: number;

  averageKda: number;
  averageKdaDelta: number;

  killParticipation: number;
  killParticipationDelta: number;

  averageGameTime: string;
  averageGameTimeDelta: string;
};


/* ==================================================
   ACTIVITY
================================================== */

export type ActivityDay = {
  label: string;
  games: number;
};

export type ActivityHour = {
  label: string;
  games: number;
  winRate: number;
};


/* ==================================================
   PROFILE
================================================== */

export type ProfileData = {
  puuid: string;

  gameName: string;
  tagLine: string;

  level: number;

  profileIcon: string;


  internalRank: InternalRank;

  internalRankImage: string;

  internalScore: string;

  internalRankPosition: number;

  internalRankWins: number;

  internalRankTotal: number;

  defenseProgress?: number;

  defenseTickets?: number;


  soloTier: string;

  soloTierKey: SoloTierKey;

  soloTierImage: string;

  soloRank: string;

  soloLp: number;


  peakTier: string;

  peakTierKey: SoloTierKey;

  peakTierImage: string;

  peakLp: number;


  customWinRate: number;

  soloWinRate: number;

  flexTier?: string;
  flexRank?: string;
  flexLp?: number;
  flexWinRate?: number;

  soloMostChampions?: ProfileChampion[];
  flexMostChampions?: ProfileChampion[];


  favoriteLine: string;

  lastUpdatedText?: string;


  mostChampions: ProfileChampion[];

  recentChampions: ProfileChampion[];


  performance: PerformanceData;

  activityDays: ActivityDay[];

  activityHours: ActivityHour[];


  matches: MatchHistoryItem[];
};


/* ==================================================
   RANK IMAGE
================================================== */

export const INTERNAL_RANK_IMAGES:
  Record<InternalRank, string> = {
  S: "/images/S_RANK.png",
  A: "/images/A_RANK.png",
  B: "/images/B_RANK.png",
  C: "/images/C_RANK.png",
  D: "/images/D_RANK.png",
  E: "/images/E_RANK.png",
  F: "/images/F_RANK.png",
};


/* ==================================================
   LOL TIER IMAGE
================================================== */

export const SOLO_TIER_IMAGES:
  Record<SoloTierKey, string> = {
  CHALLENGER: "/images/1_teer.png",
  GRANDMASTER: "/images/2_teer.png",
  MASTER: "/images/3_teer.png",
  DIAMOND: "/images/4_teer.png",
  EMERALD: "/images/5_teer.png",
  PLATINUM: "/images/6_teer.png",
  GOLD: "/images/7_teer.png",
  SILVER: "/images/8_teer.png",
  BRONZE: "/images/9_teer.png",
  IRON: "/images/10_teer.png",
};


/* ==================================================
   DATA DRAGON
================================================== */

const VERSION = "16.19.1";

const DDRAGON =
  `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img`;

const champion = (name: string) =>
  `${DDRAGON}/champion/${name}.png`;

const item = (id: number) =>
  `${DDRAGON}/item/${id}.png`;

const spell = (name: string) =>
  `${DDRAGON}/spell/${name}.png`;

const profileIcon = (id: number) =>
  `${DDRAGON}/profileicon/${id}.png`;


/* ==================================================
   MATCH DETAIL MOCK
================================================== */

const makeTeam = (
  names: string[],
  championNames: string[],
  startScore: number
): MatchTeamPlayer[] =>
  names.map((name, index) => ({
    name,

    championImage:
      champion(
        championNames[index]
      ),

    level:
      15 + (index % 4),

    opScore:
      Number(
        (
          startScore -
          index * 0.7
        ).toFixed(1)
      ),

    badge:
      index === 0
        ? "MVP"
        : index === 1
          ? "ACE"
          : `${index + 2}th`,

    kills:
      Math.max(
        1,
        8 - index
      ),

    deaths:
      3 + index,

    assists:
      10 + index * 3,

    damage:
      18000 + index * 7600,

    wards:
      `${index + 1}/${index + 4}`,

    cs:
      257 - index * 31,

    items: [
      item(3078),
      item(3047),
      item(3053),
      item(3065),
      item(3110),
      item(3340),
    ],
  }));


const blueTeam = makeTeam(
  [
    "지닝이22",
    "아구몬",
    "꽃병임",
    "하프틴",
    "송이는멋쟁",
  ],
  [
    "Volibear",
    "LeeSin",
    "Orianna",
    "Jinx",
    "Alistar",
  ],
  7.3
);


const redTeam = makeTeam(
  [
    "럭키비키",
    "노멘탈뉴비",
    "스웨인 연구가",
    "써부리써봣던",
    "황소고집",
  ],
  [
    "Renekton",
    "Viego",
    "Swain",
    "Kaisa",
    "Alistar",
  ],
  5.6
);


/* ==================================================
   MOCK PROFILE
================================================== */

export const MOCK_PROFILES: ProfileData[] = [
  {
    puuid:
      "mock-hwangso-puuid",

    gameName:
      "황소고집",

    tagLine:
      "KR3",

    level:
      590,

    profileIcon:
      profileIcon(29),


    internalRank:
      "B",

    internalRankImage:
      INTERNAL_RANK_IMAGES.B,

    internalScore:
      "B+ (20/3)",

    internalRankPosition:
      1,

    internalRankWins:
      3,

    internalRankTotal:
      20,


    soloTier:
      "골드",

    soloTierKey:
      "GOLD",

    soloTierImage:
      SOLO_TIER_IMAGES.GOLD,

    soloRank:
      "I",

    soloLp:
      59,


    peakTier:
      "챌린저",

    peakTierKey:
      "CHALLENGER",

    peakTierImage:
      SOLO_TIER_IMAGES.CHALLENGER,

    peakLp:
      2394,


    customWinRate:
      50,

    soloWinRate:
      50,

    favoriteLine:
      "미드",


    mostChampions: [
      {
        name: "알리스타",
        image: champion("Alistar"),
        winRate: 78,
        games: 32,
      },
      {
        name: "아무무",
        image: champion("Amumu"),
        winRate: 11,
        games: 9,
      },
      {
        name: "볼리베어",
        image: champion("Volibear"),
        winRate: 11,
        games: 8,
      },
    ],


    recentChampions: [
      {
        name: "알리스타",
        image: champion("Alistar"),
        winRate: 50,
        games: 10,
      },
      {
        name: "블리츠크랭크",
        image: champion("Blitzcrank"),
        winRate: 100,
        games: 1,
      },
      {
        name: "말파이트",
        image: champion("Malphite"),
        winRate: 0,
        games: 1,
      },
    ],


    performance: {
      winRate: 40,
      winRateDelta: -6,

      averageKda: 1.54,
      averageKdaDelta: -0.21,

      killParticipation: 33,
      killParticipationDelta: -5,

      averageGameTime:
        "27:48",

      averageGameTimeDelta:
        "+0:10",
    },


    activityDays: [
      {
        label: "월",
        games: 85,
      },
      {
        label: "화",
        games: 68,
      },
      {
        label: "수",
        games: 55,
      },
      {
        label: "목",
        games: 92,
      },
      {
        label: "금",
        games: 88,
      },
      {
        label: "토",
        games: 126,
      },
      {
        label: "일",
        games: 124,
      },
    ],


    activityHours: [
      {
        label: "19시",
        games: 33,
        winRate: 48,
      },
      {
        label: "20시",
        games: 38,
        winRate: 50,
      },
      {
        label: "21시",
        games: 40,
        winRate: 57,
      },
      {
        label: "22시",
        games: 53,
        winRate: 36,
      },
      {
        label: "23시",
        games: 59,
        winRate: 41,
      },
      {
        label: "00시",
        games: 58,
        winRate: 45,
      },
    ],


    matches: [
      {
        id: 1,

        result: "lose",

        queue:
          "개인/2인 랭크",

        ago:
          "19시간 전",

        duration:
          "39분 51초",

        champion:
          "알리스타",

        championImage:
          champion("Alistar"),

        championLevel:
          15,

        spells: [
          spell(
            "SummonerFlash"
          ),
          spell(
            "SummonerDot"
          ),
        ],

        runes: [
          champion(
            "Alistar"
          ),
          champion(
            "Amumu"
          ),
        ],

        kills: 3,
        deaths: 11,
        assists: 23,

        rating:
          "2.36:1",

        killParticipation:
          62,

        laneScore:
          64,

        cs:
          110,

        csPerMinute:
          3.0,

        items: [
          item(3190),
          item(3869),
          item(3109),
          item(3075),
          item(1028),
          item(3067),
        ],

        trinket:
          item(3340),

        allies: blueTeam.map(
          (player) => ({
            name:
              player.name,

            championImage:
              player.championImage,

            level:
              player.level,

            kda:
              `${player.kills}/${player.deaths}/${player.assists}`,
          })
        ),

        enemies: redTeam.map(
          (player) => ({
            name:
              player.name,

            championImage:
              player.championImage,

            level:
              player.level,

            kda:
              `${player.kills}/${player.deaths}/${player.assists}`,

            isMe:
              player.name ===
              "황소고집",
          })
        ),

        detail: {
          blueKills:
            48,

          redKills:
            42,

          blueGold:
            85866,

          redGold:
            81784,

          blueTeam,
          redTeam,
        },
      },


      {
        id: 2,

        result:
          "win",

        queue:
          "자유 랭크",

        ago:
          "20시간 전",

        duration:
          "21분 39초",

        champion:
          "노틸러스",

        championImage:
          champion(
            "Nautilus"
          ),

        championLevel:
          10,

        spells: [
          spell(
            "SummonerFlash"
          ),
          spell(
            "SummonerDot"
          ),
        ],

        runes: [
          champion("Nautilus"),
          champion("Braum"),
        ],

        kills:
          1,

        deaths:
          8,

        assists:
          9,

        rating:
          "1.25:1",

        killParticipation:
          34,

        laneScore:
          50,

        cs:
          8,

        csPerMinute:
          0.4,

        items: [
          item(3190),
          item(3869),
          item(3047),
          item(3075),
        ],

        trinket:
          item(3340),

        allies:
          blueTeam.map(
            (player) => ({
              name:
                player.name,

              championImage:
                player.championImage,

              level:
                player.level,

              kda:
                `${player.kills}/${player.deaths}/${player.assists}`,
            })
          ),

        enemies:
          redTeam.map(
            (player) => ({
              name:
                player.name,

              championImage:
                player.championImage,

              level:
                player.level,

              kda:
                `${player.kills}/${player.deaths}/${player.assists}`,
            })
          ),

        detail: {
          blueKills:
            30,

          redKills:
            21,

          blueGold:
            59230,

          redGold:
            52620,

          blueTeam,
          redTeam,
        },
      },


      {
        id: 3,

        result:
          "win",

        queue:
          "개인/2인 랭크",

        ago:
          "20시간 전",

        duration:
          "29분 22초",

        champion:
          "알리스타",

        championImage:
          champion(
            "Alistar"
          ),

        championLevel:
          14,

        spells: [
          spell(
            "SummonerFlash"
          ),
          spell(
            "SummonerDot"
          ),
        ],

        runes: [
          champion("Alistar"),
          champion("Braum"),
        ],

        kills:
          2,

        deaths:
          5,

        assists:
          23,

        rating:
          "5.00:1",

        killParticipation:
          52,

        laneScore:
          53,

        cs:
          24,

        csPerMinute:
          0.8,

        items: [
          item(3190),
          item(3869),
          item(3117),
          item(3109),
        ],

        trinket:
          item(3340),

        allies:
          blueTeam.map(
            (player) => ({
              name:
                player.name,

              championImage:
                player.championImage,

              level:
                player.level,

              kda:
                `${player.kills}/${player.deaths}/${player.assists}`,
            })
          ),

        enemies:
          redTeam.map(
            (player) => ({
              name:
                player.name,

              championImage:
                player.championImage,

              level:
                player.level,

              kda:
                `${player.kills}/${player.deaths}/${player.assists}`,
            })
          ),

        detail: {
          blueKills:
            41,

          redKills:
            29,

          blueGold:
            67210,

          redGold:
            61280,

          blueTeam,
          redTeam,
        },
      },


      {
        id:
          4,

        result:
          "lose",

        queue:
          "개인/2인 랭크",

        ago:
          "21시간 전",

        duration:
          "37분 52초",

        champion:
          "알리스타",

        championImage:
          champion(
            "Alistar"
          ),

        championLevel:
          16,

        spells: [
          spell(
            "SummonerFlash"
          ),
          spell(
            "SummonerDot"
          ),
        ],

        runes: [
          champion("Alistar"),
          champion("Braum"),
        ],

        kills:
          0,

        deaths:
          8,

        assists:
          14,

        rating:
          "1.75:1",

        killParticipation:
          38,

        laneScore:
          40,

        cs:
          24,

        csPerMinute:
          0.6,

        items: [
          item(3190),
          item(3869),
          item(3047),
          item(3109),
        ],

        trinket:
          item(3340),

        allies:
          blueTeam.map(
            (player) => ({
              name:
                player.name,

              championImage:
                player.championImage,

              level:
                player.level,

              kda:
                `${player.kills}/${player.deaths}/${player.assists}`,
            })
          ),

        enemies:
          redTeam.map(
            (player) => ({
              name:
                player.name,

              championImage:
                player.championImage,

              level:
                player.level,

              kda:
                `${player.kills}/${player.deaths}/${player.assists}`,
            })
          ),

        detail: {
          blueKills:
            32,

          redKills:
            43,

          blueGold:
            69210,

          redGold:
            75420,

          blueTeam,
          redTeam,
        },
      },
    ],
  },
];


/* ==================================================
   SEARCH MOCK
================================================== */

export const MOCK_PROFILE_SEARCH_RESULTS:
  ProfileSearchResult[] =
  MOCK_PROFILES.map(
    (profile) => ({
      puuid:
        profile.puuid,

      gameName:
        profile.gameName,

      tagLine:
        profile.tagLine,

      profileIcon:
        profile.profileIcon,

      level:
        profile.level,

      soloTier:
        profile.soloTier,

      soloRank:
        profile.soloRank,

      soloLp:
        profile.soloLp,

      internalRank:
        profile.internalRank,
    })
  );