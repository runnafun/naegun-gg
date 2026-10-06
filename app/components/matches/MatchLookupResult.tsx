import type {
  MatchLookupData,
} from "../../data/matches";

import MatchRuleGuide from
  "./MatchRuleGuide";


type Props = {
  match:
    MatchLookupData;
};


export default function MatchLookupResult({
  match,
}: Props) {
  return (
    <section className="match-lookup-hero">

      <div className="match-lookup-hero-overlay" />


      <div className="match-lookup-container">


        {/* =========================================
            MATCH INFORMATION
        ========================================== */}

        <div className="match-lookup-heading">

          <h1>
            {match.code}
          </h1>


          <span>
            {match.matchType}
            {" · "}
            {match.fearlessType}
          </span>

        </div>


        {/* =========================================
            RULE
        ========================================== */}

        <section className="match-lookup-rule-area">

          <h2 className="match-lookup-section-title">
            룰 설명
          </h2>


          <MatchRuleGuide
            onlyRuleTitle={
              match.ruleTitle
            }
            showHeading={
              false
            }
            defaultOpen
          />

        </section>


        {/* =========================================
            MATCH RESULT
        ========================================== */}

        <section className="match-lookup-players">

          <h2 className="match-lookup-section-title">
            내전 조회결과
          </h2>


          <div className="match-lookup-table">


            {/* =====================================
                TABLE HEADER
            ====================================== */}

            <div className="match-lookup-table-header">

              <span>
                닉네임
              </span>

              <span>
                주챔프 / 부챔프
              </span>

              <span>
                주포지션
              </span>

              <span>
                부포지션
              </span>

              <span>
                현재랭크
              </span>

              <span>
                탑레이팅
              </span>

              <span>
                티어평가도
              </span>

              <span>
                최근승률
              </span>

              <span>
                내전랭킹
              </span>

            </div>


            {/* =====================================
                PLAYERS
            ====================================== */}

            {match.players.map(
              (player) => (
                <div
                  key={
                    player.id
                  }
                  className="match-lookup-table-row"
                >


                  {/* =================================
                      1. 닉네임
                  ================================== */}

                  <div className="match-lookup-player">

                    <div className="match-lookup-profile-image">

                      <img
                        src={
                          player.profileIcon
                        }
                        alt=""
                      />

                    </div>


                    <span>
                      {
                        player.nickname
                      }
                    </span>

                  </div>


                  {/* =================================
                      2. 주챔프 / 부챔프
                  ================================== */}

                  <div className="match-lookup-champions">

                    <div className="match-lookup-champion-image">

                      <img
                        src={
                          player.mainChampionImage
                        }
                        alt=""
                      />

                    </div>


                    {player.subChampionImage && (
                      <div className="match-lookup-champion-image">

                        <img
                          src={
                            player.subChampionImage
                          }
                          alt=""
                        />

                      </div>
                    )}

                  </div>


                  {/* =================================
                      3. 주포지션
                  ================================== */}

                  <div className="match-lookup-position">

                    <span className="match-lookup-position-symbol">
                      ✦
                    </span>

                    <span>
                      {
                        player.mainRole
                      }
                    </span>

                  </div>


                  {/* =================================
                      4. 부포지션
                  ================================== */}

                  <div className="match-lookup-position">

                    <span className="match-lookup-position-symbol">
                      ✦
                    </span>

                    <span>
                      {
                        player.subRole
                      }
                    </span>

                  </div>


                  {/* =================================
                      5. 현재랭크
                  ================================== */}

                  <strong className="match-lookup-current-rank">
                    {
                      player.currentRank
                    }
                  </strong>


                  {/* =================================
                      6. 탑레이팅
                  ================================== */}

                  <span className="match-lookup-top-rating">
                    {
                      player.topRating
                    }
                  </span>


                  {/* =================================
                      7. 티어평가도
                  ================================== */}

                  <span className="match-lookup-tier-evaluation">
                    {
                      player.tierEvaluation
                    }
                  </span>


                  {/* =================================
                      8. 최근승률
                  ================================== */}

                  <strong className="match-lookup-winrate">
                    {
                      player.recentWinRate
                    }%
                  </strong>


                  {/* =================================
                      9. 내전랭킹
                  ================================== */}

                  <strong className="match-lookup-ranking">
                    {
                      player.internalRanking
                    }위
                  </strong>

                </div>
              )
            )}

          </div>

        </section>

      </div>

    </section>
  );
}