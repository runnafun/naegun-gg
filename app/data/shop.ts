export type ShopProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  backgroundImage?: string;
};

const loading = (champion: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion}_0.jpg`;

export const shopCardItems: ShopProduct[] = [
  {
    id: "card-choice",
    name: "카드선택권",
    price: 1000,
    image: "/images/choice_card.png",
  },
  {
    id: "card-all",
    name: "카드뽑기",
    price: 500,
    image: "/images/all_card.png",
  },
  {
    id: "card-top",
    name: "카드뽑기(탑)",
    price: 500,
    image: "/images/top_card.png",
  },
  {
    id: "card-jungle",
    name: "카드뽑기(정글)",
    price: 500,
    image: "/images/jungle_card.png",
  },
  {
    id: "card-mid",
    name: "카드뽑기(미드)",
    price: 500,
    image: "/images/mid_card.png",
  },
  {
    id: "card-bot",
    name: "카드뽑기(봇)",
    price: 500,
    image: "/images/bot_card.png",
  },
  {
    id: "card-sp",
    name: "카드뽑기(서폿)",
    price: 500,
    image: "/images/sp_card.png",
  },
];

export const shopTitleItems: ShopProduct[] = [
  {
    id: "nickname-choice",
    name: "커스텀 칭호권",
    price: 3000,
    image: "/images/choicenickname_icon.png",
  },

  {
    id: "title-alistar",
    name: "미노타우로스",
    price: 2000,
    backgroundImage: loading("Alistar"),
  },
  {
    id: "title-ahri",
    name: "구미호",
    price: 2000,
    backgroundImage: loading("Ahri"),
  },
  {
    id: "title-warwick",
    name: "피의 사냥꾼",
    price: 2000,
    backgroundImage: loading("Warwick"),
  },
  {
    id: "title-brand",
    name: "타오르는 복수",
    price: 2000,
    backgroundImage: loading("Brand"),
  },
  {
    id: "title-thresh",
    name: "지옥의 간수",
    price: 2000,
    backgroundImage: loading("Thresh"),
  },
  {
    id: "title-ashe",
    name: "서리 궁수",
    price: 2000,
    backgroundImage: loading("Ashe"),
  },
  {
    id: "title-yasuo",
    name: "용서받지 못한 자",
    price: 2000,
    backgroundImage: loading("Yasuo"),
  },
  {
    id: "title-sett",
    name: "우두머리",
    price: 2000,
    backgroundImage: loading("Sett"),
  },
  {
    id: "title-vi",
    name: "필트오버의 집행자",
    price: 2000,
    backgroundImage: loading("Vi"),
  },
  {
    id: "title-lux",
    name: "광명의 소녀",
    price: 2000,
    backgroundImage: loading("Lux"),
  },
  {
    id: "title-lee-sin",
    name: "눈먼 수도승",
    price: 2000,
    backgroundImage: loading("LeeSin"),
  },
  {
    id: "title-master-yi",
    name: "우주 검사",
    price: 2000,
    backgroundImage: loading("MasterYi"),
  },
  {
    id: "title-vayne",
    name: "어둠 사냥꾼",
    price: 2000,
    backgroundImage: loading("Vayne"),
  },
  {
    id: "title-garen",
    name: "데마시아의 힘",
    price: 2000,
    backgroundImage: loading("Garen"),
  },
  {
    id: "title-rammus",
    name: "아르마딜로",
    price: 2000,
    backgroundImage: loading("Rammus"),
  },
  {
    id: "title-galio",
    name: "위대한 석상",
    price: 2000,
    backgroundImage: loading("Galio"),
  },
  {
    id: "title-renekton",
    name: "사막의 도살자",
    price: 2000,
    backgroundImage: loading("Renekton"),
  },
  {
    id: "title-nasus",
    name: "사막의 관리자",
    price: 2000,
    backgroundImage: loading("Nasus"),
  },
  {
    id: "title-jinx",
    name: "난폭한 말괄량이",
    price: 2000,
    backgroundImage: loading("Jinx"),
  },
  {
    id: "title-braum",
    name: "프렐요드의 심장",
    price: 2000,
    backgroundImage: loading("Braum"),
  },
  {
    id: "title-morgana",
    name: "타락한 자",
    price: 2000,
    backgroundImage: loading("Morgana"),
  },
  {
    id: "title-blitzcrank",
    name: "거대 증기 골렘",
    price: 2000,
    backgroundImage: loading("Blitzcrank"),
  },
  {
    id: "title-miss-fortune",
    name: "현상금 사냥꾼",
    price: 2000,
    backgroundImage: loading("MissFortune"),
  },
  {
    id: "title-zed",
    name: "그림자의 주인",
    price: 2000,
    backgroundImage: loading("Zed"),
  },
  {
    id: "title-shen",
    name: "황혼의 눈",
    price: 2000,
    backgroundImage: loading("Shen"),
  },
  {
    id: "title-volibear",
    name: "무자비한 폭풍",
    price: 2000,
    backgroundImage: loading("Volibear"),
  },
  {
    id: "title-malphite",
    name: "거석의 파편",
    price: 2000,
    backgroundImage: loading("Malphite"),
  },
  {
    id: "title-kaisa",
    name: "공허의 딸",
    price: 2000,
    backgroundImage: loading("Kaisa"),
  },
  {
    id: "title-ornn",
    name: "거산의 화염",
    price: 2000,
    backgroundImage: loading("Ornn"),
  },
  {
    id: "title-leona",
    name: "여명의 검",
    price: 2000,
    backgroundImage: loading("Leona"),
  },
];