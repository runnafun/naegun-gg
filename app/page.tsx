import Header from "./components/Header";
import Footer from "./components/Footer";

import HeroSection from "./components/home/HeroSection";
import RankingSection from "./components/home/RankingSection";
import NewsSection from "./components/home/NewsSection";
import MatchApplySection from "./components/home/MatchApplySection";
import ChampionPreferenceSection from "./components/home/ChampionPreferenceSection";
import ActivitySection from "./components/home/ActivitySection";

export default function Home() {
  return (
    <main className="home">
      <Header active="home" />

      <HeroSection />

      <section className="contents-section">
        <div className="contents-inner">
          <RankingSection />

          <NewsSection />

          <MatchApplySection />

          <ChampionPreferenceSection />

          <ActivitySection />
        </div>
      </section>

      <Footer />
    </main>
  );
}