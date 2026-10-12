import Header from "./components/Header";
import Footer from "./components/Footer";

import HeroSection from "./components/home/HeroSection";
import RankingSection from "./components/home/RankingSection";
import NewsSection from "./components/home/NewsSection";
import MatchApplySection from "./components/home/MatchApplySection";
import ChampionPreferenceSection from "./components/home/ChampionPreferenceSection";
import ActivitySection from "./components/home/ActivitySection";
import { getHomeStatistics } from "./lib/home-statistics";
import { getHomeRankings } from "./lib/home-ranking";
import { getLiveRankingRows } from "./lib/live-rank";

export const dynamic = "force-dynamic";

export default async function Home() {
  // NAEGUN_HOME_RDS_RANKING_V13: rank position comes ONLY from real RDS UserStats.
  // Old home-ranking rows are used for decorative backgrounds only, never for ranking.
  const [oldHomeRankings, homeStats, liveRankings] = await Promise.all([
    getHomeRankings(),
    getHomeStatistics(),
    getLiveRankingRows(),
  ]);

  const backgrounds = new Map(oldHomeRankings.map((item) => [item.puuid, item.avatarUrl]));
  const rankings = liveRankings
    .filter((row) => row.played)
    .slice(0, 10)
    .map((row, index) => ({
      puuid: row.puuid,
      gameName: row.gameName,
      tagLine: row.tagLine,
      rank: index + 1,
      tier: row.rankDisplay,
      avatarUrl: backgrounds.get(row.puuid) ?? row.profileIcon,
    }));
  return (
    <main className="home">
      <Header active="home" />

      <HeroSection />

      <section className="contents-section">
        <div className="contents-inner">
          <RankingSection users={rankings} />

          <NewsSection />

          <MatchApplySection />

          <ChampionPreferenceSection
            data={homeStats.championPreference}
            sampleGames={homeStats.sampleGames}
          />

          <ActivitySection
            weeklyFrequency={homeStats.weeklyFrequency}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}