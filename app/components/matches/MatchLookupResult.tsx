import Link from "next/link";

import type {
  MatchLookupData,
} from "../../data/matches";

import MatchRuleGuide from
  "./MatchRuleGuide";

type Props = {
  match: MatchLookupData;
};

export default function MatchLookupResult({
  match,
}: Props) {
  return (
    <section className="match-lookup-hero">
      <div className="match-lookup-hero-overlay" />

      <div className="match-lookup-container">
        <div className="match-lookup-heading">
          <h1>{match.code}</h1>

          <span>
            {match.matchType}
            {" · "}
            {match.fearlessType}
          </span>
        </div>

        <section className="match-lookup-rule-area">
          <h2 className="match-lookup-section-title">
            룰 설명
          </h2>

          <MatchRuleGuide
            onlyRuleTitle={
              match.ruleTitle
            }
            onlyRuleKey={
              match.ruleKey
            }
            showHeading={false}
            defaultOpen
          />
        </section>

        <section className="match-lookup-players">
          <h2 className="match-lookup-section-title">
            내전 조회결과
          </h2>

          <div className="match-lookup-table">
            <div className="match-lookup-table-header">
              <span>닉네임</span>
              <span>주챔프 / 부챔프</span>
              <span>주포지션</span>
              <span>부포지션</span>
              <span>현재 티어</span>
              <span>탑레이팅</span>
              <span>티어평가도</span>
              <span>최근승률</span>
              <span>내전랭킹</span>
            </div>

            {match.players.map(
              (player) => (
                <div
                  key={player.id}
                  className="match-lookup-table-row"
                >
                  {player.gameName && player.tagLine ? (
                    <Link
                      href={
                        `/profile-search/result?gameName=${encodeURIComponent(
                          player.gameName
                        )}&tagLine=${encodeURIComponent(
                          player.tagLine
                        )}`
                      }
                      className="match-lookup-player match-lookup-player-link"
                    >
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
                    </Link>
                  ) : (
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
                  )}

                  <div className="match-lookup-champions">
                    {player.mainChampionImage ? (
                      <>
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
                      </>
                    ) : (
                      <span
                        style={{
                          color:
                            "rgba(255,255,255,.35)",
                        }}
                      >
                        -
                      </span>
                    )}
                  </div>

                  <div className="match-lookup-position">
                    <span>
                      {player.mainRole}
                    </span>
                  </div>

                  <div className="match-lookup-position">
                    <span>
                      {player.subRole}
                    </span>
                  </div>

                  <strong className="match-lookup-current-rank">
                    {
                      player.currentRank
                    }
                  </strong>

                  <span className="match-lookup-top-rating">
                    {
                      player.topRating
                    }
                  </span>

                  <span className="match-lookup-tier-evaluation">
                    {
                      player.tierEvaluation
                    }
                  </span>

                  <strong className="match-lookup-winrate">
                    {player.recentWinRate >= 0
                      ? `${player.recentWinRate}%`
                      : "-"}
                  </strong>

                  <strong className="match-lookup-ranking">
                    {player.internalRanking > 0
                      ? `${player.internalRanking}위`
                      : "-"}
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
