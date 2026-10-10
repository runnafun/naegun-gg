/* ==================================================
   /matches 목록 타입
================================================== */

export type MatchStatus =
  | "open"
  | "closed";


export type NormalMatch = {
  code: string;

  time: string;

  people: string;

  map: string;

  status: MatchStatus;

  forumThreadId?: string | null;
};


export type RankedMatch = {
  code: string;

  time: string;

  people: string;

  avgTier: string;

  maxTier: string;

  map: string;

  status: MatchStatus;

  forumThreadId?: string | null;
};


/* ==================================================
   기존 목록 MOCK DATA

   실제 /matches 화면은 이제 RDS 데이터를 사용합니다.
   아래 데이터는 기존 import 호환을 위해 유지합니다.
================================================== */

export const rankedMatches: RankedMatch[] = [
  {
    code: "R105",

    time: "오늘 20:00",

    people: "8 / 10",

    avgTier: "골드 II",

    maxTier: "에메랄드 IV",

    map: "소환사의 협곡",

    status: "open",
  },

  {
    code: "R104",

    time: "오늘 21:00",

    people: "10 / 10",

    avgTier: "플래티넘 IV",

    maxTier: "다이아몬드 IV",

    map: "소환사의 협곡",

    status: "closed",
  },

  {
    code: "R103",

    time: "오늘 22:00",

    people: "7 / 10",

    avgTier: "실버 I",

    maxTier: "플래티넘 III",

    map: "소환사의 협곡",

    status: "open",
  },
];


export const normalMatches: NormalMatch[] = [
  {
    code: "N103",

    time: "오늘 20:30",

    people: "8 / 10",

    map: "소환사의 협곡",

    status: "open",
  },

  {
    code: "N102",

    time: "오늘 21:30",

    people: "6 / 10",

    map: "소환사의 협곡",

    status: "open",
  },

  {
    code: "N101",

    time: "오늘 22:30",

    people: "10 / 10",

    map: "소환사의 협곡",

    status: "closed",
  },
];


/* ==================================================
   상세 조회 타입
================================================== */

export type MatchType =
  | "일반내전"
  | "랭크내전";


export type FearlessType =
  | "하드피어리스"
  | "소프트피어리스"
  | "일반";


export type InternalRank =
  | "S"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F";


export type MatchLookupStatus =
  | "open"
  | "playing"
  | "finished";


export type MatchSearchResult = {
  code: string;

  title: string;

  matchType: MatchType;

  fearlessType: FearlessType;

  status: MatchLookupStatus;
};


/* ==================================================
   PLAYER

   실제 DB 연동 기준:
   - currentRank: Riot 현재 티어 문자열
   - topRating: 탑레이팅
   - tierEvaluation: 내전.GG 티어평가도
   - internalRanking: 내전랭킹
================================================== */

export type MatchPlayer = {
  id: number;

  nickname: string;

  gameName?: string | null;
  tagLine?: string | null;

  profileIcon: string;

  /*
    아직 DB에 모스트 챔피언 데이터가 없을 수 있으므로
    optional 처리합니다.
  */
  mainChampionImage?: string;

  subChampionImage?: string;

  mainRole: string;

  subRole: string;

  /*
    예:
    "GOLD II"
    "MASTER 221LP"
    "언랭크"
  */
  currentRank: string;

  /*
    예:
    "DIAMOND IV"
  */
  topRating: string;

  /*
    내전.GG 내부 평가 점수
    예: "72.5"
  */
  tierEvaluation: string;

  recentWinRate: number;

  internalRanking: number;
};


export type MatchLookupData = {
  code: string;

  title: string;

  matchType: MatchType;

  fearlessType: FearlessType;

  status: MatchLookupStatus;

  ruleTitle: string;

  ruleKey?: string;

  ruleDescription: string;

  players: MatchPlayer[];
};


/* ==================================================
   DATA DRAGON

   아래 MOCK용 helper는 기존 코드 호환을 위해 유지합니다.
================================================== */

const VERSION =
  "16.19.1";


const DDRAGON =
  `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img`;


const champion = (
  name: string
) =>
  `${DDRAGON}/champion/${name}.png`;


const profileIcon = (
  id: number
) =>
  `${DDRAGON}/profileicon/${id}.png`;


/* ==================================================
   상세 조회 MOCK DATA

   실제 /matches/result 조회는 RDS를 사용합니다.
   기존 app/lib/matches.ts 등 옛 import가 남아 있어도
   빌드가 깨지지 않도록 유지합니다.
================================================== */

export const MOCK_MATCHES:
  MatchLookupData[] = [
  {
    code:
      "N103",

    title:
      "N103",

    matchType:
      "일반내전",

    fearlessType:
      "하드피어리스",

    status:
      "playing",

    ruleTitle:
      "하드피어리스",

    ruleDescription:
      "사용된 챔피언은 내전 종료까지 다시 선택할 수 없는 방식입니다.",

    players: [
      {
        id: 1,

        nickname:
          "김러또#1225",

        profileIcon:
          profileIcon(29),

        mainChampionImage:
          champion("Alistar"),

        subChampionImage:
          champion("Amumu"),

        mainRole:
          "MID",

        subRole:
          "SUPPORT",

        currentRank:
          "GOLD IV",

        topRating:
          "GOLD IV",

        tierEvaluation:
          "40.0",

        recentWinRate:
          78,

        internalRanking:
          78,
      },

      {
        id: 2,

        nickname:
          "아구몬#KR1",

        profileIcon:
          profileIcon(30),

        mainChampionImage:
          champion("Kaisa"),

        subChampionImage:
          champion("Senna"),

        mainRole:
          "ADC",

        subRole:
          "SUPPORT",

        currentRank:
          "PLATINUM IV",

        topRating:
          "PLATINUM III",

        tierEvaluation:
          "50.0",

        recentWinRate:
          61,

        internalRanking:
          21,
      },

      {
        id: 3,

        nickname:
          "테스트03#KR1",

        profileIcon:
          profileIcon(31),

        mainChampionImage:
          champion("Akali"),

        subChampionImage:
          champion("Ahri"),

        mainRole:
          "MID",

        subRole:
          "TOP",

        currentRank:
          "PLATINUM II",

        topRating:
          "EMERALD II",

        tierEvaluation:
          "56.0",

        recentWinRate:
          64,

        internalRanking:
          18,
      },

      {
        id: 4,

        nickname:
          "테스트04#KR1",

        profileIcon:
          profileIcon(32),

        mainChampionImage:
          champion("Orianna"),

        subChampionImage:
          champion("Jinx"),

        mainRole:
          "MID",

        subRole:
          "ADC",

        currentRank:
          "GOLD I",

        topRating:
          "PLATINUM IV",

        tierEvaluation:
          "47.0",

        recentWinRate:
          55,

        internalRanking:
          42,
      },

      {
        id: 5,

        nickname:
          "테스트05#KR1",

        profileIcon:
          profileIcon(33),

        mainChampionImage:
          champion("Thresh"),

        subChampionImage:
          champion("Nautilus"),

        mainRole:
          "SUPPORT",

        subRole:
          "MID",

        currentRank:
          "GOLD II",

        topRating:
          "GOLD I",

        tierEvaluation:
          "44.0",

        recentWinRate:
          58,

        internalRanking:
          51,
      },

      {
        id: 6,

        nickname:
          "테스트06#KR1",

        profileIcon:
          profileIcon(34),

        mainChampionImage:
          champion("Viego"),

        subChampionImage:
          champion("Renekton"),

        mainRole:
          "JUNGLE",

        subRole:
          "TOP",

        currentRank:
          "PLATINUM II",

        topRating:
          "EMERALD IV",

        tierEvaluation:
          "54.0",

        recentWinRate:
          62,

        internalRanking:
          25,
      },

      {
        id: 7,

        nickname:
          "테스트07#KR1",

        profileIcon:
          profileIcon(35),

        mainChampionImage:
          champion("Ahri"),

        subChampionImage:
          champion("Lux"),

        mainRole:
          "MID",

        subRole:
          "SUPPORT",

        currentRank:
          "EMERALD II",

        topRating:
          "DIAMOND IV",

        tierEvaluation:
          "64.0",

        recentWinRate:
          67,

        internalRanking:
          7,
      },

      {
        id: 8,

        nickname:
          "테스트08#KR1",

        profileIcon:
          profileIcon(36),

        mainChampionImage:
          champion("Swain"),

        subChampionImage:
          champion("Braum"),

        mainRole:
          "MID",

        subRole:
          "SUPPORT",

        currentRank:
          "PLATINUM I",

        topRating:
          "EMERALD III",

        tierEvaluation:
          "58.0",

        recentWinRate:
          60,

        internalRanking:
          31,
      },

      {
        id: 9,

        nickname:
          "테스트09#KR1",

        profileIcon:
          profileIcon(37),

        mainChampionImage:
          champion("Yasuo"),

        subChampionImage:
          champion("Yone"),

        mainRole:
          "TOP",

        subRole:
          "MID",

        currentRank:
          "GOLD I",

        topRating:
          "PLATINUM IV",

        tierEvaluation:
          "47.0",

        recentWinRate:
          53,

        internalRanking:
          64,
      },

      {
        id: 10,

        nickname:
          "황소고집#KR3",

        profileIcon:
          profileIcon(38),

        mainChampionImage:
          champion("Rakan"),

        subChampionImage:
          champion("Xayah"),

        mainRole:
          "SUPPORT",

        subRole:
          "MID",

        currentRank:
          "DIAMOND I",

        topRating:
          "MASTER",

        tierEvaluation:
          "82.0",

        recentWinRate:
          78,

        internalRanking:
          1,
      },
    ],
  },
];


/* ==================================================
   검색 MOCK DATA

   실제 검색 API는 RDS 기반 searchMatchLookups를 사용합니다.
   기존 import 호환 목적으로 유지합니다.
================================================== */

export const MOCK_MATCH_SEARCH_RESULTS:
  MatchSearchResult[] =
  MOCK_MATCHES.map(
    (match) => ({
      code:
        match.code,

      title:
        match.title,

      matchType:
        match.matchType,

      fearlessType:
        match.fearlessType,

      status:
        match.status,
    })
  );
