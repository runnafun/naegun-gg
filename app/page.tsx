// NAEGUN_SEO_TECH_HOME_V3
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: { absolute: "내전.GG | 롤 내전·랭크 내전 커뮤니티" },
  description: "롤 내전 커뮤니티 내전.GG에서 일반·랭크 내전 모집, 자동 팀 배정, 소환사 전적과 내전 랭킹을 확인하세요.",
  alternates: { canonical: "https://내전.com/" },
  openGraph: {
    type: "website", locale: "ko_KR", siteName: "내전.GG",
    url: "https://내전.com/", title: "내전.GG | 롤 내전·랭크 내전 커뮤니티",
    description: "일반·랭크 내전, 팀 배정, 소환사 전적과 랭킹을 내전.GG에서 만나보세요.",
    images: [{ url: "https://내전.com/images/hero-bg.webp", width: 1672, height: 941, alt: "내전.GG 협곡 배경 이미지" }],
  },
};

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