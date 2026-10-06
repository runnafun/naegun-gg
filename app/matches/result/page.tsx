import {
  redirect,
} from "next/navigation";

import Header from
  "../../components/Header";

import Footer from
  "../../components/Footer";

import MatchLookupTopBar from
  "../../components/matches/MatchLookupTopBar";

import MatchLookupResult from
  "../../components/matches/MatchLookupResult";

import {
  getMatchLookupByCode,
} from "../../lib/matchLookup";

import "./match-result.css";


type Props = {
  searchParams:
    Promise<{
      code?: string;
    }>;
};


export default async function MatchResultPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;


  const code =
    params.code ?? "";


  const match =
    getMatchLookupByCode(
      code
    );


  if (!match) {
    redirect(
      "/matches"
    );
  }


  return (
    <main className="match-lookup-page">

      <Header
        active="matches"
      />


      <MatchLookupTopBar
        match={
          match
        }
      />


      <MatchLookupResult
        match={
          match
        }
      />


      <Footer />

    </main>
  );
}