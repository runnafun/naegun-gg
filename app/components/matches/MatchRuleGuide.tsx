"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  matchRules,
} from "../../data/matchRules";


type MatchRuleGuideProps = {
  onlyRuleTitle?: string;

  showHeading?: boolean;

  defaultOpen?: boolean;
};


function ChevronIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      className={`rule-chevron ${
        open
          ? "is-open"
          : ""
      }`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 14L12 8L18 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export default function MatchRuleGuide({
  onlyRuleTitle,
  showHeading = true,
  defaultOpen = false,
}: MatchRuleGuideProps) {

  const visibleRules =
    useMemo(() => {
      if (!onlyRuleTitle) {
        return matchRules;
      }

      return matchRules.filter(
        (rule) =>
          rule.title ===
          onlyRuleTitle
      );
    }, [onlyRuleTitle]);


  const [
    openKey,
    setOpenKey,
  ] = useState(() => {
    if (
      defaultOpen &&
      visibleRules.length > 0
    ) {
      return visibleRules[0].key;
    }

    return "";
  });


  return (
    <section className="match-rule-section">

      <div className="match-rule-inner">

        {showHeading && (
          <div className="match-rule-heading">

            <h2 className="section-title">
              내전.GG 룰 확인하기
            </h2>

            <p className="match-rule-subtitle">
              내전.GG의 내전 룰을 확인해 보세요
            </p>

          </div>
        )}


        <div className="match-rule-list">

          {visibleRules.map(
            (rule) => {
              const isOpen =
                openKey ===
                rule.key;


              return (
                <article
                  key={
                    rule.key
                  }
                  className={`rule-card ${
                    isOpen
                      ? "is-open"
                      : ""
                  }`}
                >

                  <button
                    type="button"
                    className="rule-card-header"
                    onClick={() =>
                      setOpenKey(
                        isOpen
                          ? ""
                          : rule.key
                      )
                    }
                  >

                    <div className="rule-landscape-bg" />


                    <div className="rule-card-title-wrap">

                      <strong className="rule-card-title">
                        {
                          rule.title
                        }
                      </strong>

                    </div>


                    <div className="rule-card-summary">
                      {
                        rule.summary
                      }
                    </div>


                    <div className="rule-card-arrow">

                      <ChevronIcon
                        open={
                          isOpen
                        }
                      />

                    </div>

                  </button>


                  <div
                    className={`rule-card-body ${
                      isOpen
                        ? "rule-card-body-open"
                        : ""
                    }`}
                  >

                    <div className="rule-card-body-inner">

                      <div className="rule-landscape-bg" />


                      <div className="rule-card-body-content">

                        <p>
                          {
                            rule.description
                          }
                        </p>

                      </div>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

      </div>

    </section>
  );
}