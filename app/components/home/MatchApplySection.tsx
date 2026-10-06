import {
  normalMatches,
  rankedMatches,
} from "../../data/home";

function PeopleIcon() {
  return (
    <svg
      className="people-icon"
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="6"
        r="4"
        fill="currentColor"
      />

      <path
        d="M3 17c0-3.4 2.9-5.5 7-5.5s7 2.1 7 5.5"
        fill="currentColor"
      />
    </svg>
  );
}

export default function MatchApplySection() {
  return (
    <section className="match-section">
      <div className="match-grid">

        <div className="match-board">
          <h2 className="section-title">
            일반내전신청
          </h2>

          <div className="match-list">
            {normalMatches.map((match, index) => (
              <div
                className={`match-row ${
                  match.status === "open"
                    ? "is-open"
                    : "is-closed"
                }`}
                key={index}
              >
                <div className="match-left-line" />

                <div className="match-time">
                  {match.time}
                </div>

                <div className="match-people">
                  <PeopleIcon />

                  <span>
                    {match.people}
                  </span>
                </div>

                <div className="match-map">
                  {match.map}
                </div>

                <div
                  className={`match-status ${
                    match.status === "open"
                      ? "status-open"
                      : "status-closed"
                  }`}
                >
                  {match.status === "open"
                    ? "모집중"
                    : "마감"}
                </div>

                <button
                  className={`match-action ${
                    match.status === "open"
                      ? "action-open"
                      : "action-closed"
                  }`}
                >
                  {match.status === "open"
                    ? "참가하기"
                    : "모집마감"}
                </button>
              </div>
            ))}
          </div>
        </div>


        <div className="match-board">
          <h2 className="section-title">
            랭크 내전신청
          </h2>

          <div className="match-list">
            {rankedMatches.map((match, index) => (
              <div
                className={`match-row ranked-row ${
                  match.status === "open"
                    ? "is-open"
                    : "is-closed"
                }`}
                key={index}
              >
                <div className="match-left-line" />

                <div className="match-time">
                  {match.time}
                </div>

                <div className="match-people">
                  <PeopleIcon />

                  <span>
                    {match.people}
                  </span>
                </div>

                <div className="match-tier-block">
                  <span className="tier-label">
                    평균 티어
                  </span>

                  <span className="tier-avg">
                    {match.avgTier}
                  </span>
                </div>

                <div className="match-tier-block">
                  <span className="tier-label">
                    최상위 티어
                  </span>

                  <span className="tier-max">
                    {match.maxTier}
                  </span>
                </div>

                <div className="match-map">
                  {match.map}
                </div>

                <div
                  className={`match-status ${
                    match.status === "open"
                      ? "status-open"
                      : "status-closed"
                  }`}
                >
                  {match.status === "open"
                    ? "모집중"
                    : "마감"}
                </div>

                <button
                  className={`match-action ${
                    match.status === "open"
                      ? "action-open"
                      : "action-closed"
                  }`}
                >
                  {match.status === "open"
                    ? "참가하기"
                    : "모집마감"}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}