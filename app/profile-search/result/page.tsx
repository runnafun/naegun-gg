import { redirect } from "next/navigation";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import ProfileResultTopBar from "../../components/profile-search/result/ProfileResultTopBar";
import ProfileResultHero from "../../components/profile-search/result/ProfileResultHero";
import ProfileSummary from "../../components/profile-search/result/ProfileSummary";
import ProfileMatchHistory from "../../components/profile-search/result/ProfileMatchHistory";
import ProfileSidebar from "../../components/profile-search/result/ProfileSidebar";

import {
  getProfileByRiotId,
} from "../../lib/profile";

import "./profile-result.css";


type Props = {
  searchParams: Promise<{
    gameName?: string;
    tagLine?: string;
  }>;
};


export default async function ProfileResultPage({
  searchParams,
}: Props) {

  const params =
    await searchParams;


  const gameName =
    params.gameName ?? "";


  const tagLine =
    params.tagLine ?? "";


  const profile =
    await getProfileByRiotId(
      gameName,
      tagLine
    );


  if (!profile) {
    redirect(
      "/profile-search"
    );
  }


  return (
    <main className="profile-result-page">

      <Header active="profile" />


      <ProfileResultTopBar
        profile={profile}
      />


      <ProfileResultHero
        profile={profile}
      />


      <section className="profile-result-content">

        <div className="profile-result-inner">

          <ProfileSummary
            profile={profile}
          />


          <div className="profile-result-detail">

            <ProfileMatchHistory
              matches={
                profile.matches
              }
            />


            <ProfileSidebar
              profile={profile}
            />

          </div>

        </div>

      </section>


      <Footer />

    </main>
  );
}