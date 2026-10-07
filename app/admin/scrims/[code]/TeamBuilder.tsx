"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Player = {
  userId: string;
  name: string;
  currentTier: {
    tier?: string | null;
    rank?: string | null;
    lp?: number | null;
  };
  peakTier: {
    tier?: string | null;
    rank?: string | null;
    lp?: number | null;
  };
  tierEvaluation: number;
  scrimRankScore: number;

  currentTierScore?: number;
  peakTierScore?: number;
  br?: number;
};

type BalanceResult = {
  blue: Player[];
  red: Player[];
  blueTotal: number;
  redTotal: number;
  totalDiff: number;
  topDiff: number;
  distributionDiff: number;
  penalty: number;
  powerDiffPercent: number;
  evaluatedCombinations: number;
};

function tierText(
  tier: Player["currentTier"],
) {
  if (!tier?.tier) return "언랭크";

  const upper =
    tier.tier.toUpperCase();

  if (
    upper === "MASTER" ||
    upper === "GRANDMASTER" ||
    upper === "CHALLENGER"
  ) {
    return `${upper} ${tier.lp ?? 0}LP`;
  }

  return `${upper} ${tier.rank ?? ""} ${tier.lp ?? 0}LP`;
}

export default function TeamBuilder({
  code,
}: {
  code: string;
}) {
  const [players, setPlayers] =
    useState<Player[]>([]);

  const [blue, setBlue] =
    useState<Player[]>([]);

  const [red, setRed] =
    useState<Player[]>([]);

  const [result, setResult] =
    useState<BalanceResult | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const load = async () => {
    const response = await fetch(
      `/api/admin/scrims/${encodeURIComponent(code)}/balance`,
      {
        cache: "no-store",
      },
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ??
          "내전 정보를 불러오지 못했습니다.",
      );
    }

    setPlayers(
      data.players ?? [],
    );
  };

  useEffect(() => {
    load().catch((error) =>
      setMessage(error.message),
    );
  }, [code]);

  const calculate = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/scrims/${encodeURIComponent(code)}/balance`,
        {
          method: "POST",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "자동 팀 배정 실패",
        );
      }

      const next =
        data.result as BalanceResult;

      setResult(next);
      setBlue(next.blue);
      setRed(next.red);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "자동 팀 배정 실패",
      );
    } finally {
      setLoading(false);
    }
  };

  const swap = (
    blueIndex: number,
    redIndex: number,
  ) => {
    setBlue((currentBlue) => {
      const nextBlue =
        [...currentBlue];

      setRed((currentRed) => {
        const nextRed =
          [...currentRed];

        const b =
          nextBlue[blueIndex];

        const r =
          nextRed[redIndex];

        nextBlue[blueIndex] = r;
        nextRed[redIndex] = b;

        return nextRed;
      });

      return nextBlue;
    });
  };

  const confirm = async () => {
    if (
      blue.length !== 5 ||
      red.length !== 5
    ) {
      setMessage(
        "각 팀 5명이 필요합니다.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/scrims/${encodeURIComponent(code)}/confirm-team`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            blueUserIds:
              blue.map(
                (player) =>
                  player.userId,
              ),
            redUserIds:
              red.map(
                (player) =>
                  player.userId,
              ),
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "팀 확정 실패",
        );
      }

      setMessage(
        "✅ 팀 확정 완료. DB에 BLUE=A / RED=B로 저장했습니다.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "팀 확정 실패",
      );
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!result) return null;

    return {
      blue:
        blue.reduce(
          (sum, p) =>
            sum + (p.br ?? 0),
          0,
        ),
      red:
        red.reduce(
          (sum, p) =>
            sum + (p.br ?? 0),
          0,
        ),
    };
  }, [blue, red, result]);

  return (
    <section className="team-builder">
      <div className="team-toolbar">
        <div>
          <strong>
            확정 참가자 {players.length}/10
          </strong>
          <span>
            BR = 평가도 45% + 현티어 25% + 탑레이팅 15% + 내전랭크 15%
          </span>
        </div>

        <button
          type="button"
          onClick={calculate}
          disabled={
            loading ||
            players.length !== 10
          }
        >
          {loading
            ? "계산 중..."
            : "자동 팀 배정"}
        </button>
      </div>

      {message && (
        <div className="team-message">
          {message}
        </div>
      )}

      {!result && (
        <div className="player-grid">
          {players.map(
            (player) => (
              <article
                className="player-card"
                key={player.userId}
              >
                <strong>
                  {player.name}
                </strong>
                <span>
                  현티어{" "}
                  {tierText(
                    player.currentTier,
                  )}
                </span>
                <span>
                  탑레이팅{" "}
                  {tierText(
                    player.peakTier,
                  )}
                </span>
                <span>
                  평가도{" "}
                  {player.tierEvaluation.toFixed(
                    1,
                  )}
                </span>
                <span>
                  내전랭크{" "}
                  {player.scrimRankScore.toFixed(
                    1,
                  )}
                </span>
              </article>
            ),
          )}
        </div>
      )}

      {result && (
        <>
          <div className="balance-summary">
            <strong>
              전력 차이{" "}
              {result.powerDiffPercent.toFixed(
                2,
              )}
              %
            </strong>
            <span>
              126개 조합 비교 완료
            </span>
            <span>
              공식 패널티{" "}
              {result.penalty.toFixed(
                3,
              )}
            </span>
          </div>

          <div className="teams-grid">
            <div className="team-column">
              <h2>
                BLUE
                <small>
                  {summary?.blue.toFixed(
                    2,
                  )}
                </small>
              </h2>

              {blue.map(
                (player, index) => (
                  <article
                    className="player-card"
                    key={
                      player.userId
                    }
                  >
                    <strong>
                      {player.name}
                    </strong>
                    <span>
                      BR{" "}
                      {(
                        player.br ?? 0
                      ).toFixed(2)}
                    </span>

                    <select
                      defaultValue=""
                      onChange={(
                        event,
                      ) => {
                        const target =
                          Number(
                            event
                              .target
                              .value,
                          );

                        if (
                          Number.isInteger(
                            target,
                          )
                        ) {
                          swap(
                            index,
                            target,
                          );
                          event.target.value =
                            "";
                        }
                      }}
                    >
                      <option value="">
                        RED와 교체
                      </option>
                      {red.map(
                        (
                          redPlayer,
                          redIndex,
                        ) => (
                          <option
                            value={
                              redIndex
                            }
                            key={
                              redPlayer.userId
                            }
                          >
                            {
                              redPlayer.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </article>
                ),
              )}
            </div>

            <div className="team-column red">
              <h2>
                RED
                <small>
                  {summary?.red.toFixed(
                    2,
                  )}
                </small>
              </h2>

              {red.map((player) => (
                <article
                  className="player-card"
                  key={player.userId}
                >
                  <strong>
                    {player.name}
                  </strong>
                  <span>
                    BR{" "}
                    {(
                      player.br ?? 0
                    ).toFixed(2)}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="confirm-row">
            <button
              type="button"
              onClick={calculate}
              disabled={loading}
            >
              다시 계산
            </button>

            <button
              type="button"
              className="primary"
              onClick={confirm}
              disabled={loading}
            >
              팀 확정
            </button>
          </div>
        </>
      )}
    </section>
  );
}
