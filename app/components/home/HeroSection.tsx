import Image from "next/image";
import ProfileSearchInput from "../profile-search/ProfileSearchInput";

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-background" />

      <div className="hero-content">
        <Image
          src="/images/hero-title.png"
          alt="내전.GG"
          width={650}
          height={180}
          priority
          className="hero-title"
        />

        <p className="hero-description">
          내전을 더 재밌게 즐기자,
          <br />
          내전.GG 서버에 오신것을 환영합니다
        </p>

        <ProfileSearchInput variant="home" />
      </div>
    </section>
  );
}