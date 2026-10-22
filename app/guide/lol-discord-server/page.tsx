import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./guide.css";

const SITE_URL = "https://내전.com";
const ARTICLE_PATH = "/guide/lol-discord-server";
const DISCORD_URL = "https://discord.gg/a2BU6rDWcj";
const ARTICLE_TITLE = "롤 디스코드 서버 찾기 2026: 내전·듀오 커뮤니티 선택 가이드";
const ARTICLE_DESC =
  "롤 디스코드 서버와 롤 디코서버를 찾고 있나요? 실제 모집 활동, 운영 규칙, 개인정보 보호를 확인하는 법부터 내전.GG의 일반·랭크 내전 참가 방법까지 정리했습니다.";

export const metadata: Metadata = {
  title: `${ARTICLE_TITLE} | 내전.GG`,
  description: ARTICLE_DESC,
  alternates: { canonical: `${SITE_URL}${ARTICLE_PATH}` },
  openGraph: {
    type: "article",
    publishedTime: "2026-10-13",
    modifiedTime: "2026-10-13",
    locale: "ko_KR",
    url: `${SITE_URL}${ARTICLE_PATH}`,
    siteName: "내전.GG",
    // NAEGUN_SEO_TECH_ARTICLE_OG_IMAGE_V3
    images: [{ url: `${SITE_URL}/images/hero-bg.webp`, width: 1672, height: 941, alt: "내전.GG의 협곡 풍경 배경 그래픽" }],
    title: ARTICLE_TITLE,
    description: ARTICLE_DESC,
  },
  robots: { index: true, follow: true },
};

const faq = [
  {
    question: "롤 디스코드 서버는 인원이 많을수록 좋은가요?",
    answer:
      "꼭 그렇지는 않습니다. 내가 접속하는 시간대에 모집글이 올라오는지, 실제로 파티가 성사되는지, 운영 규칙과 신고 경로가 명확한지를 함께 확인해 보세요.",
  },
  {
    question: "롤 내전에는 꼭 높은 티어가 필요하나요?",
    answer:
      "내전은 서버와 모집마다 참가 조건이 다릅니다. 내전.GG에서는 모집 정보를 확인하고 참가할 수 있으며, 팀 배정에는 현재 티어와 평가 정보, 주·부포지션을 함께 반영합니다.",
  },
  {
    question: "내전.GG 랭크 내전에 참가하려면 무엇이 필요한가요?",
    answer:
      "디스코드에서 소환사 등록을 완료한 뒤 랭크 내전에 신청하면 됩니다. 경기를 기록하기 위해 참가자 10명 중 한 명은 Windows용 랭크 트래커를 연결해야 합니다.",
  },
  {
    question: "라이엇 닉네임이나 태그는 변경할 수 있나요?",
    answer:
      "내전.GG에 연동한 Riot 계정을 다른 계정으로 변경하는 기능은 30일 제한을 적용합니다. 게임 내 표시 이름의 변경 정책과는 별개이며, 서버에서 등록 안내를 확인해 주세요.",
  },
  {
    question: "내전.GG에서 팀 배정 후 라인도 정해 주나요?",
    answer:
      "주라인과 부라인은 균형 잡힌 팀을 만드는 데 활용합니다. 실제 경기에서 담당할 라인은 배정된 팀원끼리 협의하여 정합니다.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: ARTICLE_TITLE,
      description: ARTICLE_DESC,
      inLanguage: "ko-KR",
      datePublished: "2026-10-13",
      dateModified: "2026-10-13",
      mainEntityOfPage: `${SITE_URL}${ARTICLE_PATH}`,
      image: `${SITE_URL}/images/hero-bg.webp`,
      author: { "@type": "Organization", name: "내전.GG 운영팀" },
      publisher: { "@type": "Organization", name: "내전.GG", url: SITE_URL },
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

const contentIds = [
  ["selection", "좋은 롤 디코서버 선택 기준"],
  ["howto", "서버를 찾고 참가하는 순서"],
  ["naegun", "내전.GG에서는 무엇을 할 수 있나요?"],
  ["register", "소환사 등록과 개인정보"],
  ["faq", "자주 묻는 질문"],
] as const;

export default function LolDiscordServerGuide() {
  return (
    <main className="ng-guide-page">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <article>
        <header className="ng-guide-hero">
          <div className="ng-guide-hero__inner">
            <span className="ng-guide-eyebrow">내전.GG 가이드 · 디스코드</span>
            <h1>롤 디스코드 서버 찾기<span>내전부터 듀오까지, 제대로 고르는 법</span></h1>
            <p className="ng-guide-lead">
              롤 디코서버를 찾고 있다면 인원수만 보지 마세요.
              실제 모집 활동, 운영 규칙, 내전 진행 방식까지 확인하면
              나에게 맞는 커뮤니티를 고르기 쉬워집니다.
            </p>
            <div className="ng-guide-meta">
              <span>내전.GG 운영팀</span><span aria-hidden="true">·</span>
              <time dateTime="2026-10-13">2026년 10월 13일 게시</time><span aria-hidden="true">·</span><time dateTime="2026-10-13">2026년 10월 13일 수정</time>
              <span aria-hidden="true">·</span><span>약 4분 읽기</span>
            </div>
            <a className="ng-guide-primary" href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
              내전.GG 디스코드 서버 참가하기 <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>

        <div className="ng-guide-container">
          <div className="ng-guide-summary" aria-label="핵심 요약">
            <div className="ng-guide-summary__title">핵심 요약</div>
            <ul>
              <li>서버 규모보다 내 접속 시간대의 실제 모집글과 응답을 확인하세요.</li>
              <li>운영 규칙, 신고 방법, 개인정보 요구 수준을 먼저 살펴보세요.</li>
              <li>내전이 목적이라면 팀 배정 방식과 경기 기록 여부도 중요합니다.</li>
            </ul>
          </div>

          <nav className="ng-guide-toc" aria-label="가이드 목차">
            <strong>목차</strong>
            <ol>
              {contentIds.map(([id, label]) => (
                <li key={id}><a href={`#${id}`}>{label}</a></li>
              ))}
            </ol>
          </nav>

          {/* NAEGUN_SEO_TECH_ARTICLE_FIGURE_V3 */}
          <figure className="ng-guide-article-figure">
            <Image src="/images/hero-bg.webp" width={1672} height={941}
              sizes="(max-width: 1060px) 100vw, 1012px"
              alt="내전.GG 웹사이트에 사용되는 어두운 녹색 협곡 풍경 배경 이미지" />
            <figcaption>내전.GG 웹사이트에서 사용하는 협곡 배경 그래픽</figcaption>
          </figure>

          <section className="ng-guide-section" id="selection">
            <span className="ng-guide-section__index">01 / 선택 기준</span>
            <h2>좋은 롤 디코서버는 어떻게 고를까요?</h2>
            <p>
              ‘롤 디스코드 서버’나 ‘롤 디코서버’를 검색하면 친목 서버, 듀오 모집,
              일반 게임 파티, 내전 중심 서버 등 다양한 커뮤니티가 나옵니다.
              규모가 커도 내가 게임하는 시간에 참여할 사람이 없다면 실제 활용도는 낮을 수 있습니다.
            </p>
            <div className="ng-guide-table-wrap">
              <table>
                <thead><tr><th>비교 항목</th><th>좋은 신호</th><th>주의할 신호</th></tr></thead>
                <tbody>
                  <tr><th>활동성</th><td>최근 모집과 답변이 꾸준히 올라옴</td><td>회원 수는 많지만 대화가 멈춰 있음</td></tr>
                  <tr><th>채널 구성</th><td>일반·랭크·내전의 목적이 구분됨</td><td>모집글이 광고와 섞여 찾기 어려움</td></tr>
                  <tr><th>운영</th><td>규칙과 문의·신고 경로가 명확함</td><td>분쟁 대응 기준을 확인하기 어려움</td></tr>
                  <tr><th>정보 보호</th><td>게임에 필요한 정보만 요청함</td><td>비밀번호·전화번호 등 과도한 정보 요구</td></tr>
                  <tr><th>내전 진행</th><td>팀 구성 기준과 결과 기록 방식이 안내됨</td><td>경기 규칙과 팀 배정 원칙이 불분명함</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              특히 처음 방문한 서버에서는 개인 메시지로 전달되는 낯선 파일이나 링크를
              바로 실행하지 말고, 서버의 공식 안내 채널과 운영진 공지를 확인하는 것이 좋습니다.
            </p>
          </section>

          <section className="ng-guide-section" id="howto">
            <span className="ng-guide-section__index">02 / 참가 순서</span>
            <h2>롤 디스코드 서버를 찾고 검증하는 순서</h2>
            <div className="ng-guide-steps">
              <div><span>01</span><div><h3>목적을 정하세요</h3><p>솔로랭크 듀오, 5인 일반, 내전, 게임 정보 공유 중 무엇이 중요한지 먼저 정합니다.</p></div></div>
              <div><span>02</span><div><h3>최근 모집을 확인하세요</h3><p>내가 주로 접속하는 시간대에 실제 참가 신청과 응답이 있는지 살펴봅니다.</p></div></div>
              <div><span>03</span><div><h3>규칙과 인증 절차를 읽으세요</h3><p>운영 규칙, 신고 방법, 게임 계정 등록 범위와 변경 제한을 확인합니다.</p></div></div>
              <div><span>04</span><div><h3>한 번 참여해 보세요</h3><p>첫 모집에 참여해 음성 채팅 분위기와 게임 진행 방식이 맞는지 확인해 봅니다.</p></div></div>
            </div>
          </section>

          <section className="ng-guide-section" id="naegun">
            <span className="ng-guide-section__index">03 / 내전.GG</span>
            <h2>내전.GG에서는 무엇을 할 수 있나요?</h2>
            <p>
              내전.GG는 <strong>리그 오브 레전드 내전</strong>을 중심으로 운영하는 디스코드 커뮤니티입니다.
              단순 모집 채팅뿐 아니라 웹사이트에서 진행 중인 내전과 전적, 내전 랭킹 등을 확인할 수 있습니다.
            </p>
            <div className="ng-guide-feature-grid">
              <div><span>01</span><h3>일반·랭크 내전</h3><p>디스코드에서 신청하고, 웹에서 모집 중인 내전을 찾아볼 수 있습니다.</p></div>
              <div><span>02</span><h3>자동 팀 배정</h3><p>전력 지표와 주·부포지션을 고려합니다. 실제 플레이 라인은 팀원끼리 결정합니다.</p></div>
              <div><span>03</span><h3>내전 기록과 랭킹</h3><p>랭크 내전의 경기 결과를 바탕으로 자신의 기록과 랭킹을 확인할 수 있습니다.</p></div>
              <div><span>04</span><h3>경기 기록 트래커</h3><p>랭크 내전은 참가자 10명 중 한 명이 Windows 트래커를 연결해 경기를 기록합니다.</p></div>
            </div>
            <p>
              랭크 내전에서는 하드 피어리스 규칙이 적용됩니다. 모집이 마감되면 팀 배정,
              트래커 연결, 팀 확정 절차를 거쳐 경기를 시작합니다.
              자세한 모집 상태는 <Link href="/matches">내전정보</Link>에서 확인할 수 있습니다.
            </p>
          </section>

          <section className="ng-guide-section" id="register">
            <span className="ng-guide-section__index">04 / 소환사 등록</span>
            <h2>내전.GG 가입 후 소환사 등록 방법</h2>
            <p>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">내전.GG 디스코드 서버</a>에 입장하면
              입장 안내에서 소환사 등록 채널로 이동할 수 있습니다.
              Riot 닉네임과 태그, 주라인·부라인을 등록한 후 내전 참가를 시작할 수 있습니다.
            </p>
            <div className="ng-guide-note">
              <strong>계정 변경 안내</strong>
              <p>
                내전.GG에서 연동한 Riot 계정을 다른 계정으로 바꾸는 경우 30일 제한이 있습니다.
                Riot ID 조회는 입력한 게임 계정의 존재 여부 확인이며, 별도 Riot 계정 소유권 인증을 의미하지는 않습니다.
                Riot 비밀번호는 등록 과정에서 요구하지 않습니다.
              </p>
            </div>
            <p>
              랭크 내전용 트래커는 <a href="https://discord.com/channels/1547894802765451295/1558489684303159347" target="_blank" rel="noopener noreferrer">공식 트래커 안내 채널</a>에서 확인하세요.
              프로그램은 서버의 공식 배포 경로에서만 내려받는 것이 좋습니다.
            </p>
          </section>

          <section className="ng-guide-section" id="faq">
            <span className="ng-guide-section__index">05 / FAQ</span>
            <h2>자주 묻는 질문</h2>
            <div className="ng-guide-faq-list">
              {faq.map(({ question, answer }) => (
                <details key={question}>
                  <summary>{question}<span aria-hidden="true">+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* NAEGUN_SEO_V2_INTERNAL_LINKS */}
          <nav className="ng-guide-cross-links" aria-label="관련 내전.GG 가이드">
            <h2>이어 읽기</h2>
            <div>
              <Link href="/guide/lol-custom-game">롤 내전 참여 방법: 모집부터 팀 확정까지 <span>→</span></Link>
              <Link href="/lol-discord">롤 디스코드 서버 추천 · 내전.GG 소개 <span>→</span></Link>
              <Link href="/matches">진행 중인 내전 보기 <span>→</span></Link>
            </div>
          </nav>
          <aside className="ng-guide-end-cta">
            <span>LEAGUE OF LEGENDS · COMMUNITY</span>
            <h2>함께할 소환사를 찾는다면, 내전.GG</h2>
            <p>일반 내전부터 랭크 내전까지, 원하는 경기를 찾아 참여해 보세요.</p>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">디스코드 서버 참가하기 <span aria-hidden="true">↗</span></a>
            <div className="ng-guide-related">
              <Link href="/matches">진행 중인 내전 보기</Link>
              <Link href="/ranking">내전 랭킹 확인</Link>
            </div>
          </aside>
        </div>
      </article>
      <Footer />
    </main>
  );
}
