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
  const mostChampion =
    profile.mostChampions[0];

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

            <WinRateCircle
              value={
                profile.soloWinRate
              }
            />

          </div>

        </div>


        {/* 솔로랭크 모스트 */}
        <div className="profile-result-summary-item">

          <span className="profile-summary-label">
            솔로랭크 모스트
          </span>

          <div className="profile-summary-content">

            <div className="profile-result-most-list">

              {profile.mostChampions.map(
                (champion) => (
                  <div
                    key={
                      champion.name
                    }
                    className="profile-result-most"
                  >

                    <div className="profile-result-most-image">
                      <img
                        src={
                          champion.image
                        }
                        alt={
                          champion.name
                        }
                      />
                    </div>

                    <strong>
                      {
                        champion.winRate
                      }%
                    </strong>

                  </div>
                )
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

              {profile.mostChampions.map(
                (champion) => (
                  <div
                    key={
                      champion.name
                    }
                    className="profile-result-most"
                  >

                    <div className="profile-result-most-image">
                      <img
                        src={
                          champion.image
                        }
                        alt={
                          champion.name
                        }
                      />
                    </div>

                    <strong>
                      {
                        champion.winRate
                      }%
                    </strong>

                  </div>
                )
              )}

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

          <div className="profile-summary-content">

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

          </div>

        </div>

      </div>

    </section>
  );
}