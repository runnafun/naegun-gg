import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./landing.css";

const SITE = "https://내전.com";
const INVITE = "https://discord.gg/a2BU6rDWcj";
const PAGE_TITLE = "롤 디스코드 서버 추천 · 롤 디코서버 내전 모집 | 내전.GG";
const PAGE_DESC = "롤 디코서버를 찾고 있다면 내전.GG! 일반·랭크 내전 모집, 자동 팀 배정, 소환사 전적과 내전 랭킹까지. 무료로 참여하고 함께 게임할 소환사를 만나보세요.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESC,
  alternates: { canonical: `${SITE}/lol-discord` },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${SITE}/lol-discord`,
    siteName: "내전.GG",
    // NAEGUN_SEO_TECH_LANDING_OG_V3
    images: [{ url: `${SITE}/images/hero-bg.webp`, width: 1672, height: 941, alt: "내전.GG 협곡 배경 이미지" }],
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
  twitter: { card: "summary", title: PAGE_TITLE, description: PAGE_DESC },
};

const faq = [
  {
    q: "내전.GG 디스코드 서버는 무료인가요?",
    a: "내전.GG의 일반·랭크 내전 모집에는 참가비가 없습니다. 서버 규칙을 확인한 뒤 참여할 수 있습니다.",
  },
  {
    q: "롤 디스코드 서버에 가입하면 무엇을 할 수 있나요?",
    a: "디스코드에서 일반 내전과 랭크 내전을 신청하고, 웹사이트에서 내전 정보, 소환사 기록 및 내전 랭킹을 확인할 수 있습니다.",
  },
  {
    q: "주라인과 부라인을 등록하면 그 라인으로만 경기해야 하나요?",
    a: "아니요. 팀 배정의 균형을 계산하기 위한 정보입니다. 실제 경기에서 플레이할 라인은 팀원끼리 협의합니다.",
  },
  {
    q: "랭크 내전에서는 모든 참가자가 트래커를 설치해야 하나요?",
    a: "아니요. 한 경기에서 참가자 10명 중 한 명만 경기 기록 트래커를 연결하면 됩니다. 공식 다운로드 방법은 디스코드 안내 채널에서 확인해 주세요.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: PAGE_TITLE,
  description: PAGE_DESC,
  inLanguage: "ko-KR",
  url: `${SITE}/lol-discord`,
  publisher: { "@type": "Organization", name: "내전.GG", url: SITE },
};

export default function LolDiscordLanding() {
  return (
    <main className="ng-landing">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <section className="ng-landing-hero">
        <div className="ng-landing-wrap">
          <p className="ng-landing-kicker">LEAGUE OF LEGENDS · DISCORD COMMUNITY</p>
          <h1>롤 디스코드 서버,<br />내전은 내전.GG에서</h1>
          <p className="ng-landing-intro">
            <strong>롤 디코서버</strong>를 찾고 있다면 내전.GG에서 함께할 소환사를 만나보세요.
            일반 내전과 랭크 내전 모집, 포지션을 고려한 팀 배정, 내전 기록과 랭킹을 한 곳에서 확인할 수 있습니다.
          </p>
          <div className="ng-landing-actions">
            <a className="ng-landing-action-primary" href={INVITE} target="_blank" rel="noopener noreferrer">디스코드 서버 참가하기 <span aria-hidden="true">↗</span></a>
            <Link className="ng-landing-action-secondary" href="/matches">진행 중인 내전 보기 <span aria-hidden="true">→</span></Link>
          </div>
          <p className="ng-landing-hero-note">무료 참가 · 디스코드에서 소환사 등록 후 내전 신청</p>
        </div>
      </section>

      <div className="ng-landing-wrap ng-landing-body">
        <section aria-labelledby="ng-landing-why">
          <span className="ng-landing-label">WHY NAEGUN.GG</span>
          <h2 id="ng-landing-why">함께 게임할 사람을 찾는 것부터, 내전 기록까지</h2>
          <p className="ng-landing-section-intro">
            롤 디스코드 서버를 고를 때는 단순한 멤버 수보다 실제 모집 방식과 운영 규칙을 살펴보는 것이 중요합니다.
            내전.GG는 내전을 신청하고 팀을 구성하며 기록을 확인하는 과정을 지원합니다.
          </p>
          <div className="ng-landing-cards">
            <div><span>01</span><h3>일반 · 랭크 내전</h3><p>모집 중인 내전에서 참가를 신청하고 디스코드에서 팀원과 소통하세요.</p></div>
            <div><span>02</span><h3>주포지션을 고려한 팀 배정</h3><p>참가자 전력과 주·부포지션을 반영합니다. 실제 경기 라인은 팀원끼리 협의합니다.</p></div>
            <div><span>03</span><h3>내전 기록 · 랭킹</h3><p>내전 결과와 소환사 기록, 랭킹을 웹사이트에서 확인할 수 있습니다.</p></div>
            <div><span>04</span><h3>랭크 내전 트래커</h3><p>참가자 한 명의 트래커 연결로 랭크 내전 경기 기록을 수집합니다.</p></div>
          </div>
        </section>

        <section className="ng-landing-join" aria-labelledby="ng-landing-join-title">
          <div>
            <span className="ng-landing-label">HOW TO JOIN</span>
            <h2 id="ng-landing-join-title">내전.GG 서버 참가 방법</h2>
            <p>처음 방문하는 소환사도 안내에 따라 단계별로 참가할 수 있습니다.</p>
          </div>
          <ol>
            <li><b>01</b><div><strong>디스코드 서버 입장</strong><p>초대 링크를 통해 내전.GG 서버에 들어옵니다.</p></div></li>
            <li><b>02</b><div><strong>소환사 등록</strong><p>Riot 닉네임·태그와 주·부포지션을 등록합니다. 계정 변경에는 30일 제한이 적용됩니다.</p></div></li>
            <li><b>03</b><div><strong>내전 신청</strong><p>일반·랭크 내전 모집글을 확인하고 참가합니다.</p></div></li>
            <li><b>04</b><div><strong>팀 배정 후 경기</strong><p>랭크 내전은 팀 배정 → 트래커 연결 → 팀 확정 순서로 진행합니다.</p></div></li>
          </ol>
        </section>

        <section className="ng-landing-guides" aria-labelledby="ng-landing-guides-title">
          <span className="ng-landing-label">GUIDES & TIPS</span>
          <h2 id="ng-landing-guides-title">롤 디코서버와 내전, 더 알아보기</h2>
          <div className="ng-landing-guide-grid">
            <Link href="/guide/lol-discord-server">
              <span>디스코드 커뮤니티 가이드</span>
              <strong>롤 디스코드 서버 찾기: 좋은 커뮤니티 고르는 법</strong>
              <span className="ng-landing-guide-arrow">자세히 보기 →</span>
            </Link>
            <Link href="/guide/lol-custom-game">
              <span>내전 참여 가이드</span>
              <strong>롤 내전 참여 방법: 모집부터 팀 확정까지</strong>
              <span className="ng-landing-guide-arrow">자세히 보기 →</span>
            </Link>
            <Link href="/ranking">
              <span>내전.GG 기능</span>
              <strong>내전 랭킹과 소환사 기록 확인하기</strong>
              <span className="ng-landing-guide-arrow">내전 랭킹 보기 →</span>
            </Link>
          </div>
        </section>

        <section className="ng-landing-faq" aria-labelledby="ng-landing-faq-title">
          <span className="ng-landing-label">FAQ</span>
          <h2 id="ng-landing-faq-title">자주 묻는 질문</h2>
          {faq.map(({ q, a }) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </section>

        <aside className="ng-landing-bottom-cta">
          <h2>이제 함께할 소환사를 만나보세요.</h2>
          <p>롤 내전 모집, 자동 팀 배정, 경기 기록까지. 내전.GG에서 시작하세요.</p>
          <a href={INVITE} target="_blank" rel="noopener noreferrer">내전.GG 디스코드 서버 참가하기 ↗</a>
        </aside>
      </div>
      <Footer />
    </main>
  );
}
