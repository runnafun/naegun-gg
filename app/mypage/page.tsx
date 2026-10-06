import {
  redirect,
} from "next/navigation";

import Header from "../components/Header";
import Footer from "../components/Footer";

import {
  getSession,
} from "../lib/auth";

import {
  prisma,
} from "../lib/prisma";

export default async function MyPage() {
  const session =
    await getSession();

  if (!session) {
    redirect(
      "/api/auth/discord",
    );
  }

  const user =
    await prisma.user.findUnique(
      {
        where: {
          id: session.userId,
        },

        include: {
          discordAccount:
            true,

          riotAccount:
            true,

          wallet: true,

          stats: true,

          defenseStats:
            true,
        },
      },
    );

  if (!user) {
    redirect("/");
  }

  const displayName =
    user.discordAccount
      ?.globalName ??
    user.discordAccount
      ?.username ??
    "내전.GG 사용자";

  return (
    <main className="mypage">
      <Header />

      <section className="mypage-inner">
        <div className="mypage-heading">
          <p>
            MY PROFILE
          </p>

          <h1>
            {displayName}
          </h1>

          <span>
            내전.GG 계정 정보
          </span>
        </div>

        <div className="mypage-grid">
          <article className="mypage-card">
            <span className="mypage-label">
              GG 코인
            </span>

            <strong className="mypage-value mypage-green">
              {(
                user.wallet
                  ?.balance ??
                BigInt(0)
              ).toString()}
              {" GG"}
            </strong>
          </article>

          <article className="mypage-card">
            <span className="mypage-label">
              전적
            </span>

            <strong className="mypage-value">
              {
                user.stats
                  ?.wins ??
                0
              }
              승{" "}
              {
                user.stats
                  ?.losses ??
                0
              }
              패
            </strong>
          </article>

          <article className="mypage-card">
            <span className="mypage-label">
              방어권
            </span>

            <strong className="mypage-value">
              {
                user.defenseStats
                  ?.tickets ??
                0
              }
              개
            </strong>
          </article>
        </div>

        <section
          id="riot"
          className="mypage-section"
        >
          <div className="mypage-section-title">
            <h2>
              Riot 계정
            </h2>
          </div>

          {user.riotAccount ? (
            <div className="mypage-riot-box">
              <strong>
                {
                  user.riotAccount
                    .gameName
                }
                #
                {
                  user.riotAccount
                    .tagLine
                }
              </strong>

              <span>
                연결된 Riot 계정
              </span>
            </div>
          ) : (
            <div className="mypage-empty">
              <strong>
                연결된 Riot 계정이 없습니다.
              </strong>

              <span>
                다음 단계에서 Riot 계정 연결 기능을 붙입니다.
              </span>
            </div>
          )}
        </section>

        <section
          id="history"
          className="mypage-section"
        >
          <div className="mypage-section-title">
            <h2>
              내 전적
            </h2>
          </div>

          <div className="mypage-empty">
            <strong>
              아직 저장된 내전 기록이 없습니다.
            </strong>

            <span>
              내전 DB 연동 후 실제 BO3 기록이 표시됩니다.
            </span>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}