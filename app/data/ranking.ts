export type RankingUser = {
  puuid: string;
  gameName: string;
  tagLine: string;
  rank: number;
  summonerName: string;
  profileIcon: string;
  internalRank: string;
  soloTier: string;
  mostChampions: string[];
  winRate: number | null;
};
