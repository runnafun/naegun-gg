import Header from "../components/Header";
import Footer from "../components/Footer";

import RankingHero from "../components/ranking/RankingHero";
import RankingTable from "../components/ranking/RankingTable";

import "./ranking.css";

export default function RankingPage() {
  return (
    <main className="ranking-page">
      <Header active="ranking" />

      <RankingHero />

      <RankingTable />

      <Footer />
    </main>
  );
}