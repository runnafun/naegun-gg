import type {
  ProfileData,
} from "../../../data/profile";


type Props = {
  profile: ProfileData;
};


function WinRateCircle({
  value,
}: {
  value: number;
}) {
  return (
    <div className="profile-result-winrate">
      <div
        className="profile-result-winrate-circle"
        style={{
          background: `conic-gradient(
            #df1f33 0 ${value}%,
            #2389df ${value}% 100%
          )`,
        }}
      >
        <div className="profile-result-winrate-center" />
      </div>

      <strong>
        {value}%
      </strong>
    </div>
  );
}


function getChampionSplashUrl(
  championImage: string
) {
  const fileName =
    championImage
      .split("/")
      .pop()
      ?.replace(".png", "");

  if (!fileName) {
    return "";
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${fileName}_0.jpg`;
}


export default function ProfileSummary({
  profile,
}: Props) {
  const soloMostChampions =
    profile.soloMostChampions ??
    profile.mostChampions;

  const soloMostTop3 =
    [...soloMostChampions]
      .sort(
        (a, b) =>
          b.games - a.games
      )
      .slice(0, 3);

  const soloRankGameCount =
    profile.matches.filter(
      (match) =>
        match.queueId === 420
    ).length;

  const mostChampion =
    soloMostTop3[0];

  const mostChampionSplash =
    mostChampion
      ? getChampionSplashUrl(
          mostChampion.image
        )
      : "";


  return (
    <section className="profile-result-summary">

      {mostChampionSplash && (
        <div
          className="profile-summary-champion-bg"
          style={{
            backgroundImage:
              `url("${mostChampionSplash}")`,
          }}
        />
      )}


      <div className="profile-summary-bg-overlay" />


      <div className="profile-result-summary-title">
        프로필 요약
      </div>


      <div className="profile-result-summary-grid">

        {/* 내전 승률 */}
        <div className="profile-result-summary-item">

          <span className="profile-summary-label">
            내전 승률
          </span>

          <div className="profile-summary-content">

            <WinRateCircle
              value={
                profile.customWinRate
              }
            />

          </div>

        </div>


        {/* 솔로랭크 승률 */}
        <div className="profile-result-summary-item">

          <span className="profile-summary-label">
            솔로랭크 승률
          </span>

          <div className="profile-summary-content">

            {profile.soloWinRate >= 0 ? (
              <WinRateCircle
                value={
                  profile.soloWinRate
                }
              />
            ) : (
              <strong className="profile-empty-value">
                -
              </strong>
            )}

          </div>

        </div>


        {/* 최근 40경기 솔로랭크 모스트 */}
        <div className="profile-result-summary-item">

          <span className="profile-summary-label">
            최근 40경기 솔로랭크 모스트
          </span>

          <div className="profile-summary-content">

            <div className="profile-result-most-list">

              {soloMostTop3.length > 0 ? (
                soloMostTop3.map(
                  (champion) => {

                    const playRate =
                      soloRankGameCount > 0
                        ? Math.round(
                            (
                              champion.games /
                              soloRankGameCount
                            ) * 100
                          )
                        : 0;

                    return (
                      <div
                        key={champion.name}
                        className="profile-result-most"
                      >

                        <div className="profile-result-most-image">
                          <img
                            src={champion.image}
                            alt={champion.name}
                          />
                        </div>

                        <strong>
                          {champion.games}게임
                          <br />
                          {playRate}%
                        </strong>

                      </div>
                    );
                  }
                )
              ) : (
                <span className="profile-most-empty">
                  - 없음
                </span>
              )}

            </div>

          </div>

        </div>


        {/* 내전랭크 모스트 */}
        <div className="profile-result-summary-item">

          <span className="profile-summary-label">
            내전랭크 모스트
          </span>

          <div className="profile-summary-content">

            <div className="profile-result-most-list">
              <span className="profile-most-empty">
                - 없음
              </span>
            </div>

          </div>

        </div>


        {/* 자주가는 라인 */}
        <div className="profile-result-summary-item">

          <span className="profile-summary-label">
            자주가는 라인
          </span>

          <div className="profile-summary-content">

            <div className="profile-result-role">

              <b>
                ✦
              </b>

              <strong>
                {
                  profile.favoriteLine
                }
              </strong>

            </div>

          </div>

        </div>


        {/* 내전랭크 */}
        <div className="profile-result-summary-item profile-result-rank-history">

          <span className="profile-summary-label">
            내전랭크 (
            {
              profile.internalRankTotal
            }
            /
            {
              profile.internalRankWins
            }
            )
          </span>

          <div className="profile-summary-content profile-rank-summary-content">

            <div className="profile-result-rank-shields">

              {Array.from({
                length:
                  profile.internalRankTotal,
              }).map(
                (_, index) => (
                  <i
                    key={index}
                    className={
                      index <
                      profile.internalRankWins
                        ? "active"
                        : ""
                    }
                  />
                )
              )}

            </div>


            <div className="profile-defense-system">

              <div className="profile-defense-head">

                <strong>
                  보호막 시스템
                </strong>

                <span>
                  {
                    profile.defenseProgress ?? 0
                  }%
                </span>

              </div>


              <div className="profile-defense-progress">

                <i
                  style={{
                    width:
                      `${Math.min(
                        Math.max(
                          profile.defenseProgress ?? 0,
                          0,
                        ),
                        100,
                      )}%`,
                  }}
                />

              </div>


              <div className="profile-defense-bottom">

                <div className="profile-defense-slots">

                  {Array.from({
                    length: 2,
                  }).map(
                    (_, index) => (
                      <i
                        key={index}
                        className={
                          index <
                          (
                            profile.defenseTickets ?? 0
                          )
                            ? "active"
                            : ""
                        }
                      />
                    )
                  )}

                </div>

                <span>
                  {
                    profile.defenseTickets ?? 0
                  }
                  /2
                </span>

              </div>


              <p>
                100% 달성 시 보호막 1개 획득 · 최대 2개
              </p>

            </div>

          </div>

        </div>
        </div>

      </div>

    </section>
  );
}