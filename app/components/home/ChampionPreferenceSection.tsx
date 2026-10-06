"use client";

import { useState } from "react";
import { championPreference } from "../../data/home";

type Position = keyof typeof championPreference;

const positions: {
  key: Position;
  label: string;
}[] = [
  { key: "top", label: "탑" },
  { key: "jungle", label: "정글" },
  { key: "mid", label: "미드" },
  { key: "adc", label: "원딜" },
  { key: "support", label: "서폿" },
];

export default function ChampionPreferenceSection() {
  const [position, setPosition] =
    useState<Position>("top");

  return (
    <section className="champion-preference-section">
      <div className="champion-preference-header">
        <h2 className="section-title">
          챔피언 선호도 순위
        </h2>

        <div className="position-tabs">
          {positions.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`position-tab ${
                position === item.key
                  ? "position-tab-active"
                  : ""
              }`}
              onClick={() =>
                setPosition(item.key)
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="preference-list">
        {championPreference[position].map(
          ([name, percent, champion], index) => (
            <article
              key={`${position}-${name}`}
              className="preference-card"
              style={{
                backgroundImage:
                  `url("https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion}_0.jpg")`,
              }}
            >
              <div className="preference-shade" />

              <span className="preference-rank">
                {index + 1}위
              </span>

              <div className="preference-info">
                <span className="preference-percent">
                  {percent}
                </span>

                <strong className="preference-name">
                  {name}
                </strong>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}