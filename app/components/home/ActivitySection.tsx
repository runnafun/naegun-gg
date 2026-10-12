import {
  cardCollectRanking,
} from "../../data/home";

import type {
  WeeklyFrequencyItem,
} from "../../lib/home-statistics";

function buildChartPoints(
  data: {
    day: string;
    value: number;
  }[]
) {
  const width = 560;
  const left = 38;
  const right = 30;
  const top = 65;
  const bottomY = 210;

  const innerWidth =
    width - left - right;

  const maxValue = Math.max(
    ...data.map((item) => item.value)
  );


  return data.map((item, index) => {
    const x =
      left +
      (innerWidth /
        (data.length - 1)) *
        index;

    const usableHeight =
      bottomY - top - 20;

    const y =
      bottomY -
      (item.value / Math.max(maxValue, 1)) *
        usableHeight;

    return {
      ...item,
      x,
      y,
    };
  });
}

export default function ActivitySection({
  weeklyFrequency,
}: {
  weeklyFrequency: WeeklyFrequencyItem[];
}) {
  const totalScrims = weeklyFrequency.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const chartPoints =
    buildChartPoints(
      weeklyFrequency
    );

  const linePath =
    chartPoints
      .map(
        (point, index) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x} ${point.y}`
      )
      .join(" ");

  const areaPath = `
    ${linePath}
    L ${
      chartPoints[
        chartPoints.length - 1
      ].x
    } 215
    L ${chartPoints[0].x} 215
    Z
  `;

  return (
    <section className="activity-section">
      <div className="activity-grid">

        <div className="activity-panel">
          <h2 className="section-title">
            롤토카드 랭킹
          </h2>

          <div className="collect-preview">
          <div className="collect-list">
            {cardCollectRanking.map(
              (item) => (
                <div
                  className="collect-row"
                  key={item.rank}
                >
                  <div className="collect-left">
                    <span className="collect-rank">
                      {item.rank}위
                    </span>

                    <span className="collect-name">
                      {item.name}
                    </span>
                  </div>

                  <span className="collect-count">
                    수집카드 {item.count}장
                  </span>
                </div>
              )
            )}
          </div>

          <div
            className="collect-coming-soon"
            aria-label="롤토카드 랭킹 준비중"
          >
            준비중입니다
          </div>
          </div>
        </div>


        <div className="activity-panel">
          <h2 className="section-title">
            내전 생성 빈도
          </h2>

          <div className="frequency-card">
            <div className="frequency-days">
              {weeklyFrequency.map(
                (item) => (
                  <span key={item.day}>
                    {item.day}
                  </span>
                )
              )}
            </div>

            <svg
              className="frequency-chart"
              viewBox="0 0 560 240"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  id="frequencyArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#4e63ff"
                    stopOpacity="0.35"
                  />

                  <stop
                    offset="55%"
                    stopColor="#4e63ff"
                    stopOpacity="0.13"
                  />

                  <stop
                    offset="100%"
                    stopColor="#4e63ff"
                    stopOpacity="0"
                  />
                </linearGradient>

                <linearGradient
                  id="frequencyLine"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor="#4e63ff"
                  />

                  <stop
                    offset="100%"
                    stopColor="#7d91ff"
                  />
                </linearGradient>
              </defs>

              <line
                x1="38"
                y1="215"
                x2="530"
                y2="215"
                className="chart-grid"
              />

              <line
                x1="38"
                y1="165"
                x2="530"
                y2="165"
                className="chart-grid chart-grid-faint"
              />

              <line
                x1="38"
                y1="115"
                x2="530"
                y2="115"
                className="chart-grid chart-grid-faint"
              />

              <path
                d={areaPath}
                className="frequency-area"
              />

              <path
                d={linePath}
                className="frequency-line"
              />

              {chartPoints.map(
                (point) => (
                  <g key={point.day}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="8"
                      className="frequency-dot-glow"
                    />

                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      className="frequency-dot"
                    />
                  </g>
                )
              )}
            </svg>

            <div className="frequency-bottom">
              <span>
                최근 7일 기준
              </span>

              <strong>
                총 {totalScrims.toLocaleString("ko-KR")}회
              </strong>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}