/* ==================================================
   기존 /matches 목록용 타입
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
};


export type RankedMatch = {
  code: string;

  time: string;

  people: string;

  avgTier: string;

  maxTier: string;

  map: string;

  status: MatchStatus;
};


/* ==================================================
   기존 /matches 목록 데이터
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

   표 컬럼과 데이터명을 1:1로 맞춤
================================================== */

export type MatchPlayer = {
  id: number;

  nickname: string;

  profileIcon: string;

  mainChampionImage: string;

  subChampionImage?: string;

  mainRole: string;

  subRole: string;

  /*
    현재랭크
    내전.GG 자체 랭크
  */
  currentRank: InternalRank;

  /*
    탑레이팅
  */
  topRating: string;

  /*
    티어평가도
  */
  tierEvaluation: string;

  /*
    최근승률
  */
  recentWinRate: number;

  /*
    내전랭킹
  */
  internalRanking: number;
};


export type MatchLookupData = {
  code: string;

  title: string;

  matchType: MatchType;

  fearlessType: FearlessType;

  status: MatchLookupStatus;

  ruleTitle: string;

  ruleDescription: string;

  players: MatchPlayer[];
};


/* ==================================================
   DATA DRAGON
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
      "사용된 챔피언은 내전 종료까지 계속 재선택할 수 없는 경쟁 방식입니다.",

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
          "미드",

        subRole:
          "서포터",

        currentRank:
          "C",

        topRating:
          "골드 IV",

        tierEvaluation:
          "골드 IV",

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
          "원딜",

        subRole:
          "서포터",

        currentRank:
          "B",

        topRating:
          "플래티넘 III",

        tierEvaluation:
          "플래티넘 IV",

        recentWinRate:
          61,

        internalRanking:
          21,
      },

      {
        id: 3,

        nickname:
          "꽃병임#KR1",

        profileIcon:
          profileIcon(31),

        mainChampionImage:
          champion("Akali"),

        subChampionImage:
          champion("Ahri"),

        mainRole:
          "미드",

        subRole:
          "탑",

        currentRank:
          "B",

        topRating:
          "에메랄드 II",

        tierEvaluation:
          "에메랄드 IV",

        recentWinRate:
          64,

        internalRanking:
          18,
      },

      {
        id: 4,

        nickname:
          "하프틴#KR1",

        profileIcon:
          profileIcon(32),

        mainChampionImage:
          champion("Orianna"),

        subChampionImage:
          champion("Jinx"),

        mainRole:
          "미드",

        subRole:
          "서포터",

        currentRank:
          "C",

        topRating:
          "플래티넘 IV",

        tierEvaluation:
          "골드 I",

        recentWinRate:
          55,

        internalRanking:
          42,
      },

      {
        id: 5,

        nickname:
          "송이는멋쟁#KR1",

        profileIcon:
          profileIcon(33),

        mainChampionImage:
          champion("Thresh"),

        subChampionImage:
          champion("Nautilus"),

        mainRole:
          "서포터",

        subRole:
          "미드",

        currentRank:
          "C",

        topRating:
          "골드 I",

        tierEvaluation:
          "골드 II",

        recentWinRate:
          58,

        internalRanking:
          51,
      },

      {
        id: 6,

        nickname:
          "럭키비키#KR1",

        profileIcon:
          profileIcon(34),

        mainChampionImage:
          champion("Viego"),

        subChampionImage:
          champion("Renekton"),

        mainRole:
          "정글",

        subRole:
          "탑",

        currentRank:
          "B",

        topRating:
          "에메랄드 IV",

        tierEvaluation:
          "플래티넘 II",

        recentWinRate:
          62,

        internalRanking:
          25,
      },

      {
        id: 7,

        nickname:
          "노멘탈뉴비#KR1",

        profileIcon:
          profileIcon(35),

        mainChampionImage:
          champion("Ahri"),

        subChampionImage:
          champion("Lux"),

        mainRole:
          "미드",

        subRole:
          "서포터",

        currentRank:
          "A",

        topRating:
          "다이아몬드 IV",

        tierEvaluation:
          "에메랄드 II",

        recentWinRate:
          67,

        internalRanking:
          7,
      },

      {
        id: 8,

        nickname:
          "스웨인연구가#KR1",

        profileIcon:
          profileIcon(36),

        mainChampionImage:
          champion("Swain"),

        subChampionImage:
          champion("Braum"),

        mainRole:
          "미드",

        subRole:
          "서포터",

        currentRank:
          "B",

        topRating:
          "에메랄드 III",

        tierEvaluation:
          "플래티넘 I",

        recentWinRate:
          60,

        internalRanking:
          31,
      },

      {
        id: 9,

        nickname:
          "써부리써봣던#KR1",

        profileIcon:
          profileIcon(37),

        mainChampionImage:
          champion("Yasuo"),

        subChampionImage:
          champion("Yone"),

        mainRole:
          "탑",

        subRole:
          "미드",

        currentRank:
          "C",

        topRating:
          "플래티넘 IV",

        tierEvaluation:
          "골드 I",

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
          "서포터",

        subRole:
          "미드",

        currentRank:
          "B",

        topRating:
          "챌린저",

        tierEvaluation:
          "다이아몬드 I",

        recentWinRate:
          78,

        internalRanking:
          1,
      },
    ],
  },
];


/* ==================================================
   검색 결과 DATA
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