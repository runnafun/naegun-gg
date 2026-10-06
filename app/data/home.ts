export const rankingUsers = [
  {
    rank: 1,
    nickname: "황소고집",
    tier: "S+",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Volibear_0.jpg",
  },
  {
    rank: 2,
    nickname: "박바로박",
    tier: "S+",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ezreal_0.jpg",
  },
  {
    rank: 3,
    nickname: "이즈나",
    tier: "S+",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Draven_0.jpg",
  },
  {
    rank: 4,
    nickname: "리필",
    tier: "S+",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Sion_0.jpg",
  },
  {
    rank: 5,
    nickname: "구미호장인",
    tier: "S",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
  },
  {
    rank: 6,
    nickname: "바람은과학",
    tier: "S",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
  },
  {
    rank: 7,
    nickname: "로켓배송",
    tier: "A+",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
  },
  {
    rank: 8,
    nickname: "사슬장인",
    tier: "A+",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Leblanc_0.jpg",
  },
  {
    rank: 9,
    nickname: "상남자펀치",
    tier: "A+",
    image:
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Sett_0.jpg",
  },
];

export const noticeItems = [
  "내전.GG 티어 기재 및 밸런스 운영 관련 안내",
  "저티어 내전 모집합니다! | 9월 28일 저티어 내전 공지안내",
  "내전지지 서버 사이트 오픈 예정 안내",
  "저티어 내전 모집합니다! | 9월 28일 저티어 내전 공지안내",
  "내전.GG 티어 기재 및 밸런스 운영 관련 안내",
  "저티어 내전 모집합니다! | 9월 28일 저티어 내전 공지안내",
];

export const normalMatches = [
  {
    time: "26.09.30 9시 30분",
    people: "(10/3)",
    map: "하드피어리스",
    status: "open",
  },
  {
    time: "26.09.30 10시 10분",
    people: "(10/5)",
    map: "벤피어리스",
    status: "open",
  },
  {
    time: "26.09.30 9시 30분",
    people: "(10/1)",
    map: "하드피어리스",
    status: "closed",
  },
  {
    time: "26.09.30 10시 10분",
    people: "(10/5)",
    map: "벤피어리스",
    status: "closed",
  },
] as const;

export const rankedMatches = [
  {
    time: "26.09.30 9시 30분",
    people: "(10/3)",
    avgTier: "D3",
    maxTier: "M3",
    map: "하드피어리스",
    status: "open",
  },
  {
    time: "26.09.30 10시 10분",
    people: "(10/5)",
    avgTier: "D3",
    maxTier: "M3",
    map: "벤피어리스",
    status: "open",
  },
  {
    time: "26.09.30 9시 30분",
    people: "(10/1)",
    avgTier: "D3",
    maxTier: "M3",
    map: "하드피어리스",
    status: "closed",
  },
  {
    time: "26.09.30 10시 10분",
    people: "(10/5)",
    avgTier: "D3",
    maxTier: "M3",
    map: "하드피어리스",
    status: "closed",
  },
] as const;

export const championPreference = {
  top: [
    ["암베사", "18.7%", "Ambessa"],
    ["아트록스", "16.4%", "Aatrox"],
    ["세트", "14.8%", "Sett"],
    ["그웬", "12.2%", "Gwen"],
    ["카밀", "10.7%", "Camille"],
    ["잭스", "9.4%", "Jax"],
    ["레넥톤", "8.1%", "Renekton"],
    ["다리우스", "6.9%", "Darius"],
    ["케넨", "5.8%", "Kennen"],
    ["피오라", "4.9%", "Fiora"],
  ],

  jungle: [
    ["리 신", "20.1%", "LeeSin"],
    ["비에고", "17.4%", "Viego"],
    ["그레이브즈", "14.3%", "Graves"],
    ["니달리", "12.1%", "Nidalee"],
    ["에코", "10.8%", "Ekko"],
    ["킨드레드", "9.2%", "Kindred"],
    ["케인", "7.6%", "Kayn"],
    ["바이", "6.3%", "Vi"],
    ["자르반 4세", "5.4%", "JarvanIV"],
    ["녹턴", "4.6%", "Nocturne"],
  ],

  mid: [
    ["아리", "21.4%", "Ahri"],
    ["신드라", "17.2%", "Syndra"],
    ["아칼리", "14.8%", "Akali"],
    ["사일러스", "12.9%", "Sylas"],
    ["요네", "10.6%", "Yone"],
    ["오리아나", "8.9%", "Orianna"],
    ["아지르", "7.2%", "Azir"],
    ["제드", "5.8%", "Zed"],
    ["르블랑", "4.9%", "Leblanc"],
    ["빅토르", "4.1%", "Viktor"],
  ],

  adc: [
    ["카이사", "20.9%", "Kaisa"],
    ["이즈리얼", "18.3%", "Ezreal"],
    ["징크스", "15.7%", "Jinx"],
    ["케이틀린", "12.8%", "Caitlyn"],
    ["아펠리오스", "10.5%", "Aphelios"],
    ["자야", "8.6%", "Xayah"],
    ["바루스", "7.1%", "Varus"],
    ["루시안", "5.3%", "Lucian"],
    ["애쉬", "4.5%", "Ashe"],
    ["칼리스타", "3.9%", "Kalista"],
  ],

  support: [
    ["쓰레쉬", "19.8%", "Thresh"],
    ["노틸러스", "17.5%", "Nautilus"],
    ["라칸", "14.9%", "Rakan"],
    ["룰루", "12.4%", "Lulu"],
    ["레오나", "10.8%", "Leona"],
    ["바드", "8.6%", "Bard"],
    ["밀리오", "7.2%", "Milio"],
    ["브라움", "5.9%", "Braum"],
    ["알리스타", "4.8%", "Alistar"],
    ["파이크", "4.0%", "Pyke"],
  ],
} as const;

export const cardCollectRanking = [
  {
    rank: 1,
    name: "김적토",
    count: 38,
  },
  {
    rank: 2,
    name: "박바로박",
    count: 35,
  },
  {
    rank: 3,
    name: "황소고집",
    count: 33,
  },
  {
    rank: 4,
    name: "이즈나",
    count: 29,
  },
  {
    rank: 5,
    name: "리필",
    count: 27,
  },
];

export const weeklyFrequency = [
  { day: "월", value: 41 },
  { day: "화", value: 38 },
  { day: "수", value: 46 },
  { day: "목", value: 35 },
  { day: "금", value: 60 },
  { day: "토", value: 69 },
  { day: "일", value: 64 },
];