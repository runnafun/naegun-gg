import type {
  NormalMatch,
  RankedMatch,
} from "../../data/matches";

type MatchBoardSectionProps =
  | {
      type: "ranked";
      title: string;
      description: string;
      matches: RankedMatch[];
    }
  | {
      type: "normal";
      title: string;
      description: string;
      matches: NormalMatch[];
    };

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

export default function MatchBoardSection(
  props: MatchBoardSectionProps
) {
  const {
    type,
    title,
    description,
    matches,
  } = props;

  return (
    <section
      className={`matches-board-section ${
        type === "normal"
          ? "matches-normal-section"
          : ""
      }`}
    >
      <div className="matches-section-heading">
        <div>
          <h2 className="section-title">
            {title}
          </h2>

          <p className="matches-section-description">
            {description}
          </p>
        </div>

        <span className="matches-open-count">
          {matches.length}개 모집중
        </span>
      </div>

      <div className="match-list matches-full-list">
        {matches.map((match) => {
          const isOpen =
            match.status === "open";

          return (
            <div
              className={`match-row ${
                type === "ranked"
                  ? "matches-ranked-row"
                  : "matches-normal-row"
              } ${
                isOpen
                  ? "is-open"
                  : "is-closed"
              }`}
              key={match.code}
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

              <div className="matches-code-block">
                <span className="matches-code-label">
                  내전 코드
                </span>

                <strong className="matches-code">
                  {match.code}
                </strong>
              </div>

              {type === "ranked" && (
                <>
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
                </>
              )}

              <div className="match-map">
                {match.map}
              </div>

              <div
                className={`match-status ${
                  isOpen
                    ? "status-open"
                    : "status-closed"
                }`}
              >
                {isOpen ? "모집중" : "마감"}
              </div>

              <button
                type="button"
                className={`match-action ${
                  isOpen
                    ? "action-open"
                    : "action-closed"
                }`}
              >
                {isOpen
                  ? "참가하기"
                  : "모집마감"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}