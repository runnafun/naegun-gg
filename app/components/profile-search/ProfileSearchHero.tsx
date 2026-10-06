import ProfileSearchInput from "./ProfileSearchInput";


export default function ProfileSearchHero() {
  return (
    <section className="profile-search-hero">

      <div className="profile-search-hero-overlay" />


      <div className="profile-search-hero-content">

        <h1 className="profile-search-title">
          찾으시는 소환사명을 검색해주세요
        </h1>


        <p className="profile-search-description">
          내전.GG에서만 확인할 수 있는 정보를 제공합니다
        </p>


        <ProfileSearchInput
          variant="hero"
        />

      </div>

    </section>
  );
}