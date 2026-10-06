import Header from "../components/Header";
import Footer from "../components/Footer";

import MatchSearchHero from
  "../components/matches/MatchSearchHero";

import MatchBoardSection from
  "../components/matches/MatchBoardSection";

import MatchRuleGuide from
  "../components/matches/MatchRuleGuide";

import {
  normalMatches,
  rankedMatches,
} from "../data/matches";

import "./matches.css";


export default function MatchesPage() {
  return (
    <main className="matches-page">

      <Header active="matches" />


      <MatchSearchHero />


      <div className="matches-content">

        <div className="matches-content-inner">

          <MatchBoardSection
            type="ranked"
            title="랭크 내전"
            description="내전.GG 랭크가 적용되는 경쟁형 내전입니다."
            matches={
              rankedMatches
            }
          />


          <MatchBoardSection
            type="normal"
            title="일반 내전"
            description="부담 없이 참여할 수 있는 일반 내전입니다."
            matches={
              normalMatches
            }
          />


          <MatchRuleGuide />

        </div>

      </div>


      <Footer />

    </main>
  );
}