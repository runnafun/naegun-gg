import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../lol-discord-server/guide.css";

const SITE = "https://내전.com";
const INVITE = "https://discord.gg/a2BU6rDWcj";
const TITLE = "롤 내전 참여 방법: 모집부터 팀 배정·트래커 연결까지";
const DESC = "롤 내전은 어떻게 참가할까요? 내전.GG 일반·랭크 내전 신청, 주·부포지션 등록, 자동 팀 배정, 트래커 연결과 BO3 진행 순서를 알아봅니다.";
export const metadata: Metadata = {
  title: { absolute: `${TITLE} | 내전.GG` },
  description: DESC,
  alternates: { canonical: `${SITE}/guide/lol-custom-game` },
  robots: { index: true, follow: true },
  openGraph: { type: "article", publishedTime: "2026-10-13", modifiedTime: "2026-10-13", locale: "ko_KR", url: `${SITE}/guide/lol-custom-game`, title: TITLE, description: DESC, siteName: "내전.GG", /* NAEGUN_SEO_TECH_CUSTOM_OG_IMAGE_V3 */ images: [{ url: `${SITE}/images/background_1.png`, width: 1672, height: 941, alt: "내전.GG 게임 배경 이미지" }] },
};
const schema = { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESC, inLanguage: "ko-KR", datePublished: "2026-10-13", dateModified: "2026-10-13", mainEntityOfPage: `${SITE}/guide/lol-custom-game`, image: `${SITE}/images/background_1.png`, author: { "@type": "Organization", name: "내전.GG 운영팀" }, publisher: { "@type": "Organization", name: "내전.GG", url: SITE } };

export default function LolCustomGameGuide() {
  return (
    <main className="ng-guide-page">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <article>
        <header className="ng-guide-hero">
          <div className="ng-guide-hero__inner">
            <span className="ng-guide-eyebrow">내전.GG 가이드 · 롤 내전</span>
            <h1>롤 내전 참여 방법<span>모집부터 팀 확정까지, 한눈에 보기</span></h1>
            <p className="ng-guide-lead">롤 내전이 처음이어도 괜찮습니다. 일반 내전과 랭크 내전의 차이, 소환사 등록 방법, 자동 팀 배정과 트래커 연결 순서를 정리했습니다.</p>
            <div className="ng-guide-meta"><span>내전.GG 운영팀</span><span>·</span><time dateTime="2026-10-13">2026년 10월 13일 게시</time><span>·</span><time dateTime="2026-10-13">2026년 10월 13일 수정</time><span>·</span><span>약 4분 읽기</span></div>
            <a className="ng-guide-primary" href={INVITE} target="_blank" rel="noopener noreferrer">내전.GG 디스코드 서버 참가하기 ↗</a>
          </div>
        </header>
        <div className="ng-guide-container">
          <div className="ng-guide-summary"><div className="ng-guide-summary__title">핵심 요약</div><ul><li>디스코드에서 Riot 닉네임·태그 및 주·부포지션을 등록합니다.</li><li>일반·랭크 내전 중 참가하려는 모집글에 신청합니다.</li><li>랭크 내전은 팀 배정 → 트래커 연결 → 팀 확정 후 경기를 시작합니다.</li></ul></div>
          <nav className="ng-guide-toc" aria-label="가이드 목차"><strong>목차</strong><ol><li><a href="#signup">서버 가입과 소환사 등록</a></li><li><a href="#types">일반 내전과 랭크 내전</a></li><li><a href="#balance">자동 팀 배정</a></li><li><a href="#tracker">트래커 연결과 확정</a></li><li><a href="#tips">첫 내전 체크리스트</a></li></ol></nav>
          {/* NAEGUN_SEO_TECH_CUSTOM_FIGURE_V3 */}
          <figure className="ng-guide-article-figure">
            <Image src="/images/background_1.png" width={1672} height={941}
              sizes="(max-width: 1060px) 100vw, 1012px"
              alt="내전.GG 웹사이트에서 사용하는 녹색 조명의 판타지 도시 게임 배경" />
            <figcaption>내전.GG 웹사이트에서 사용하는 게임 배경 그래픽</figcaption>
          </figure>

          <section className="ng-guide-section" id="signup">
            <span className="ng-guide-section__index">01 / 참가 준비</span>
            <h2>서버 가입 후 소환사 등록부터 시작하세요</h2>
            <p>내전.GG 디스코드 서버에 입장하면 등록 채널에서 소환사 정보를 등록합니다. Riot 닉네임과 태그, 주포지션과 부포지션을 입력하면 내전 참가에 필요한 기본 정보가 준비됩니다. 예를 들어 닉네임이 ‘소환사이름’, 태그가 ‘KR1’이면 두 항목을 구분해 입력하면 됩니다.</p>
            <p>주라인과 부라인은 팀 구성의 참고 자료입니다. 경기에서 무조건 해당 라인으로 플레이하라는 뜻은 아닙니다. 또한 연동한 Riot 계정을 다른 계정으로 변경하는 경우에는 30일 제한이 적용되므로 처음 등록할 때 정확히 확인하는 것이 좋습니다.</p>
            <p>디스코드 서버를 아직 선택하지 않았다면 <Link href="/guide/lol-discord-server">좋은 롤 디스코드 서버 고르는 방법</Link>을 먼저 읽어보세요.</p>
          </section>
          <section className="ng-guide-section" id="types">
            <span className="ng-guide-section__index">02 / 내전 유형</span>
            <h2>일반 내전과 랭크 내전은 무엇이 다른가요?</h2>
            <div className="ng-guide-table-wrap"><table><thead><tr><th>구분</th><th>일반 내전</th><th>랭크 내전</th></tr></thead><tbody><tr><th>목적</th><td>함께 경기를 즐기는 내전</td><td>결과와 랭크 기록을 관리하는 내전</td></tr><tr><th>신청</th><td>일반 내전 모집글에서 참가</td><td>랭크 내전 모집글에서 참가</td></tr><tr><th>팀 구성</th><td>모집 안내에 따라 구성</td><td>전력과 주·부포지션을 고려한 자동 배정</td></tr><tr><th>경기 기록</th><td>모집 유형별 안내 확인</td><td>Windows 랭크 트래커 연결 필요</td></tr><tr><th>경기 진행</th><td>모집글에 표시된 규칙 확인</td><td>하드 피어리스·BO3 진행</td></tr></tbody></table></div>
            <p>모집 중인 내전은 <Link href="/matches">내전.GG 내전정보 페이지</Link>에서도 찾아볼 수 있습니다. 시작 시간이나 참가 조건이 적혀 있다면 신청 전에 확인하세요.</p>
          </section>
          <section className="ng-guide-section" id="balance">
            <span className="ng-guide-section__index">03 / 팀 배정</span>
            <h2>랭크 내전은 팀을 어떻게 나누나요?</h2>
            <p>10명이 모이면 모집을 마감하고 팀 자동 배정을 진행합니다. 내전.GG의 팀 배정은 현재 티어, 최고 티어, 평가 정보, 내전 랭크 등 전력 요소와 참가자의 주·부포지션을 함께 고려합니다. 특정 포지션의 주라인 인원이 한 팀에 몰리지 않도록 분산하는 조건도 적용합니다.</p>
            <p>다만 어떤 자동 배정 방식도 매 경기의 승률을 정확히 절반으로 보장할 수는 없습니다. 배정 결과는 게임 실력과 실제 포지션 선택, 챔피언 조합에 따라 달라질 수 있습니다. 팀이 정해진 후에는 음성 채널에서 실제 플레이할 라인을 서로 협의합니다.</p>
            <p>내전 랭크 기록이 궁금하다면 <Link href="/ranking">내전 랭킹 페이지</Link>에서 확인할 수 있습니다.</p>
          </section>
          <section className="ng-guide-section" id="tracker">
            <span className="ng-guide-section__index">04 / 트래커 · 팀 확정</span>
            <h2>트래커 연결 후 팀을 확정합니다</h2>
            <div className="ng-guide-steps"><div><span>01</span><div><h3>모집 마감</h3><p>참가자 10명이 채워지면 개설자 또는 관리자가 모집을 마감합니다.</p></div></div><div><span>02</span><div><h3>팀 자동 배정</h3><p>팀 배정 결과를 확인하고 팀원들이 실제 경기 포지션을 협의합니다.</p></div></div><div><span>03</span><div><h3>트래커 연결</h3><p>참가자 10명 중 한 명이 트래커를 실행하고 해당 내전 코드를 연결합니다. 모든 참가자가 설치할 필요는 없습니다.</p></div></div><div><span>04</span><div><h3>팀 확정과 경기 시작</h3><p>연결 상태가 확인되면 팀을 확정하고, 안내에 따라 경기를 시작합니다.</p></div></div></div>
            <p>트래커는 <a href="https://discord.com/channels/1547894802765451295/1558489684303159347" target="_blank" rel="noopener noreferrer">내전.GG 공식 트래커 안내 채널</a>에서 확인할 수 있습니다. 외부에서 전달된 출처 불명의 실행 파일은 설치하지 마세요.</p>
          </section>
          <section className="ng-guide-section" id="tips">
            <span className="ng-guide-section__index">05 / 첫 내전 체크리스트</span>
            <h2>처음 참여할 때 확인할 것</h2>
            <p>모집글에서 내전 코드와 진행 상태를 확인하고, 게임 시작 전에 팀원들과 음성 채널·챔피언 선택 규칙·라인을 합의하세요. 랭크 내전에서는 세트별 챔피언 중복 제한이 적용되는 하드 피어리스 규칙을 이해해 두는 것이 좋습니다.</p>
            <p>트래커 연결을 맡은 참가자는 프로그램이 정상 연결된 상태인지 확인하세요. 내전 종료 후에는 안내에 따라 결과가 기록됐는지 확인하면 됩니다. 문제가 발생하면 운영진에게 내전 코드와 상황을 전달하세요. 비밀번호나 인증 코드는 공유하지 마세요.</p>
          </section>
          <nav className="ng-guide-cross-links" aria-label="관련 내전.GG 가이드"><h2>이어 읽기</h2><div><Link href="/guide/lol-discord-server">롤 디스코드 서버 선택 기준 알아보기 <span>→</span></Link><Link href="/lol-discord">내전.GG 롤 디코서버 소개와 참가 링크 <span>→</span></Link><Link href="/matches">진행 중인 내전 보기 <span>→</span></Link></div></nav>
          <aside className="ng-guide-end-cta"><span>LEAGUE OF LEGENDS · COMMUNITY</span><h2>내전.GG에서 첫 내전을 시작해 보세요</h2><p>디스코드에서 소환사를 등록하고 모집 중인 경기에 참가할 수 있습니다.</p><a href={INVITE} target="_blank" rel="noopener noreferrer">디스코드 서버 참가하기 ↗</a><div className="ng-guide-related"><Link href="/matches">진행 중인 내전 보기</Link><Link href="/ranking">내전 랭킹 확인</Link></div></aside>
        </div>
      </article>
      <Footer />
    </main>
  );
}
