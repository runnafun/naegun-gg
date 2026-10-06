import type {
  ProfileData,
} from "../../../data/profile";


type Props = {
  profile:
    ProfileData;
};


export default function ProfileSidebar({
  profile,
}: Props) {
  const maxDayGames =
    Math.max(
      ...profile.activityDays.map(
        (item) =>
          item.games
      )
    );


  const maxHourGames =
    Math.max(
      ...profile.activityHours.map(
        (item) =>
          item.games
      )
    );


  return (
    <aside className="profile-result-sidebar">


      {/* =============================================
          RANK
      ============================================== */}

      <div className="profile-side-card">

        <div className="profile-side-title">
          랭크
        </div>


        {profile.mostChampions.map(
          (champion) => (
            <div
              key={
                champion.name
              }
              className="profile-side-champion"
            >

              <div className="profile-side-champion-image">
                <img
                  src={
                    champion.image
                  }
                  alt={
                    champion.name
                  }
                />
              </div>


              <div className="profile-side-champion-info">

                <strong>
                  {
                    champion.name
                  }
                </strong>

                <span>
                  {
                    champion.games
                  } 게임
                </span>

              </div>


              <b>
                {
                  champion.winRate
                }%
              </b>

            </div>
          )
        )}

      </div>


      {/* =============================================
          PERFORMANCE
      ============================================== */}

      <div className="profile-side-card">

        <div className="profile-side-title">
          퍼포먼스
        </div>


        <div className="profile-performance-grid">


          <div className="profile-performance-item">

            <span>
              승률
            </span>

            <strong>
              {
                profile.performance.winRate
              }%
            </strong>

            <em>
              {
                profile.performance.winRateDelta
              }%
            </em>

            <div className="profile-performance-bar">
              <i
                style={{
                  width:
                    `${profile.performance.winRate}%`,
                }}
              />
            </div>

          </div>


          <div className="profile-performance-item">

            <span>
              평균 KDA
            </span>

            <strong>
              {
                profile.performance.averageKda
              }
            </strong>

            <em>
              {
                profile.performance.averageKdaDelta
              }
            </em>

            <div className="profile-performance-bar">
              <i
                style={{
                  width:
                    `${Math.min(
                      profile.performance.averageKda *
                        25,
                      100
                    )}%`,
                }}
              />
            </div>

          </div>


          <div className="profile-performance-item">

            <span>
              킬 관여율
            </span>

            <strong>
              {
                profile.performance.killParticipation
              }%
            </strong>

            <em>
              {
                profile.performance.killParticipationDelta
              }%
            </em>

            <div className="profile-performance-bar">
              <i
                style={{
                  width:
                    `${profile.performance.killParticipation}%`,
                }}
              />
            </div>

          </div>


          <div className="profile-performance-item">

            <span>
              평균 게임 시간
            </span>

            <strong>
              {
                profile.performance.averageGameTime
              }
            </strong>

            <em className="positive">
              {
                profile.performance.averageGameTimeDelta
              }
            </em>

            <div className="profile-performance-bar teal">
              <i
                style={{
                  width:
                    "63%",
                }}
              />
            </div>

          </div>


        </div>

      </div>


      {/* =============================================
          RECENT
      ============================================== */}

      <div className="profile-side-card">

        <div className="profile-side-title">
          최근 7일간 랭크 승률 (+아레나)
        </div>


        {profile.recentChampions.map(
          (champion) => {

            const wins =
              Math.round(
                champion.games *
                (
                  champion.winRate /
                  100
                )
              );


            const loses =
              champion.games -
              wins;


            return (
              <div
                key={
                  champion.name
                }
                className="profile-recent-row"
              >

                <div className="profile-recent-champion-image">
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
                    champion.name
                  }
                </strong>


                <div className="profile-recent-result">

                  <span className="recent-win">
                    {
                      wins
                    }승
                  </span>

                  <span className="recent-lose">
                    {
                      loses
                    }패
                  </span>

                </div>


                <b>
                  {
                    champion.winRate
                  }%
                </b>

              </div>
            );
          }
        )}

      </div>


      {/* =============================================
          ACTIVITY
      ============================================== */}

      <div className="profile-side-card">

        <div className="profile-side-title">
          활동 패턴
        </div>


        <div className="profile-activity-days">

          {profile.activityDays.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.label
                }
                className="profile-activity-day"
              >

                <div className="profile-activity-bar-wrap">

                  <i
                    className={
                      index === 6
                        ? "hot"
                        : ""
                    }
                    style={{
                      height:
                        `${
                          (
                            item.games /
                            maxDayGames
                          ) *
                          100
                        }%`,
                    }}
                  />

                </div>

                <span>
                  {
                    item.label
                  }
                </span>

              </div>
            )
          )}

        </div>


        <div className="profile-activity-hours">

          {profile.activityHours.map(
            (item) => (
              <div
                key={
                  item.label
                }
                className="profile-hour-row"
              >

                <span>
                  {
                    item.label
                  }
                </span>


                <div className="profile-hour-track">

                  <i
                    style={{
                      width:
                        `${
                          (
                            item.games /
                            maxHourGames
                          ) *
                          100
                        }%`,
                    }}
                  >
                    {
                      item.games
                    }
                    게임
                  </i>

                </div>


                <strong>
                  {
                    item.winRate
                  }%
                </strong>

              </div>
            )
          )}

        </div>

      </div>


    </aside>
  );
}