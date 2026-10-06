import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileSearchHero from "../components/profile-search/ProfileSearchHero";

import "./profile-search.css";

export default function ProfileSearchPage() {
  return (
    <main className="profile-search-page">

      <Header active="profile" />

      <ProfileSearchHero />

      <Footer />

    </main>
  );
}