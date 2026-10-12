import { tierToAbsoluteLp, adjustedAbsoluteLp, type BalanceTier } from "./balance-lp";

export const LANES = [
  "TOP", "JUNGLE", "MID", "ADC", "SUPPORT"
] as const;

type Lane = typeof LANES[number];

export type RankPlayer = {
  userId: string;
  name: string;
  currentTier: BalanceTier;
  peakTier: BalanceTier;
  evaluationBaseTier?: BalanceTier;
  evaluationLpOffset?: number;
  tierEvaluation: number;
  scrimRankScore: number;
  scrimGames: number;
  defenseProgress: number;
  mainPosition: string | null;
  subPosition: string | null;
};

export type RankRatedPlayer = RankPlayer & {
  currentTierScore: number;
  peakTierScore: number;
  adjustedEvaluation: number;
  reliability: number;
  internalRankScore: number;
  assignedPosition: Lane;
  br: number;
};

const sum = (xs: number[]) =>
  xs.reduce((a, b) => a + b, 0);

const avg = (xs: number[]) =>
  sum(xs) / Math.max(1, xs.length);

const deviation = (xs: number[]) => {
  const mean = avg(xs);
  return Math.sqrt(
    avg(xs.map(x => (x - mean) ** 2))
  );
};

const r2 = (n: number) =>
  Math.round(n * 100) / 100;

/** 과거 호환용: 순위 방패/보호 게이지를 팀 전력으로 쓰지 않음. */
export function rankScore(progress: number) {
  return Math.max(0, Math.min(100, Math.max(0, Math.min(102, progress)) / 102 * 100));
}

export function ratePlayer(p: RankPlayer): RankRatedPlayer {
  const base = p.evaluationBaseTier?.tier ? p.evaluationBaseTier : p.currentTier;
  const offset = p.evaluationLpOffset ?? 0;
  const score = adjustedAbsoluteLp(base, offset);
  if (score === null) {
    throw new Error(`${p.name}: 현재 솔로랭크 정보가 없습니다. 관리자 > 티어 평가에서 기준 티어를 지정해 주세요.`);
  }
  return {
    ...p,
    currentTierScore: tierToAbsoluteLp(p.currentTier) ?? 0,
    peakTierScore: tierToAbsoluteLp(p.peakTier) ?? 0,
    // 이전 필드명은 기존 응답/디스코드 표시 호환을 위해 유지.
    adjustedEvaluation: score,
    reliability: 1,
    internalRankScore: 0,
    assignedPosition: "TOP",
    br: score,
  };
}

// 주포지션 > 부포지션 > 상관없음 > 강제배정
function positionCost(
  p: RankRatedPlayer,
  lane: Lane
) {
  if (p.mainPosition === lane) return 0;
  if (p.subPosition === lane) return 12;

  if (
    p.mainPosition === "ANY" ||
    p.subPosition === "ANY"
  ) return 15;

  if (
    !p.mainPosition &&
    !p.subPosition
  ) return 20;

  return 40;
}

type Lineup = {
  players: RankRatedPlayer[];
  penalty: number;
};

// 한 팀 5명의 가능한 라인 배정 120개
function lineups(
  team: RankRatedPlayer[]
): Lineup[] {
  const out: Lineup[] = [];

  function visit(
    remaining: RankRatedPlayer[],
    chosen: RankRatedPlayer[],
    penalty: number
  ) {
    if (chosen.length === 5) {
      out.push({ players: chosen, penalty });
      return;
    }

    const lane = LANES[chosen.length];

    for (let i = 0; i < remaining.length; i++) {
      const player = {
        ...remaining[i],
        assignedPosition: lane,
      };

      visit(
        [
          ...remaining.slice(0, i),
          ...remaining.slice(i + 1),
        ],
        [...chosen, player],
        penalty + positionCost(player, lane)
      );
    }
  }

  visit(team, [], 0);

  return out.sort(
    (a, b) => a.penalty - b.penalty
  );
}

function evaluate(
  blue: RankRatedPlayer[],
  red: RankRatedPlayer[]
) {
  const blueBR = blue.map(p => p.br);
  const redBR = red.map(p => p.br);

  const totalDiff = Math.abs(
    sum(blueBR) - sum(redBR)
  );

  const topDiff = Math.abs(
    Math.max(...blueBR) -
    Math.max(...redBR)
  );

  const distributionDiff = Math.abs(
    deviation(blueBR) -
    deviation(redBR)
  );

  // 전력은 보정된 실제 누적 LP. 기존의 평가45/현재25/탑레15/보호게이지15 폐기.
  // 총합 차이는 양 팀 1인당 평균 LP 차이로 정규화.
  const teamPenalty = totalDiff / 5;

  let best: {
    blue: RankRatedPlayer[];
    red: RankRatedPlayer[];
    penalty: number;
    lineDiff: number;
    positionPenalty: number;
  } | null = null;

  const bOptions = lineups(blue);
  const rOptions = lineups(red);

  // 팀 밸런스 70% + 라인 20% + 선호도 10%
  for (const b of bOptions) {
    for (const r of rOptions) {
      const lineDiff = avg(
        b.players.map(
          (p, i) =>
            Math.abs(
              p.br - r.players[i].br
            )
        )
      );

      // 주포지션/부포지션 불이익을 LP 단위로 환산 (전력 점수에 직접 가산하지 않음).
      const positionPenalty = (b.penalty + r.penalty) / 10 * 8;

      // 팀 합계 70%, 같은 라인 매칭 20%, 포지션 선호도 10%.
      const penalty = teamPenalty * 0.70 + lineDiff * 0.20 + positionPenalty * 0.10;

      if (
        !best ||
        penalty < best.penalty
      ) {
        best = {
          blue: b.players,
          red: r.players,
          penalty,
          lineDiff,
          positionPenalty,
        };
      }
    }
  }

  return {
    ...best!,
    totalDiff,
    topDiff,
    distributionDiff,
  };
}

export function balanceRankTeams(
  input: RankPlayer[]
) {
  if (
    input.length !== 10 ||
    new Set(input.map(p => p.userId)).size !== 10
  ) {
    throw new Error(
      "서로 다른 확정 참가자 10명이 필요합니다."
    );
  }

  const players = input.map(ratePlayer);

  let best:
    ReturnType<typeof evaluate> | null = null;

  // 10명 중 첫 선수를 블루에 고정
  // 실제 비교 조합 = 126개
  for (let mask = 0; mask < (1 << 9); mask++) {
    if (
      mask.toString(2)
        .replace(/0/g, "").length !== 4
    ) continue;

    const blue = [players[0]];
    const red: RankRatedPlayer[] = [];

    for (let i = 1; i < 10; i++) {
      if (mask & (1 << (i - 1))) {
        blue.push(players[i]);
      } else {
        red.push(players[i]);
      }
    }

    const candidate =
      evaluate(blue, red);

    if (
      !best ||
      candidate.penalty < best.penalty
    ) {
      best = candidate;
    }
  }

  if (!best) {
    throw new Error("팀 구성에 실패했습니다.");
  }

  const blueTotal =
    sum(best.blue.map(p => p.br));

  const redTotal =
    sum(best.red.map(p => p.br));

  return {
    blue: best.blue,
    red: best.red,
    blueTotal: r2(blueTotal),
    redTotal: r2(redTotal),
    totalDiff: r2(best.totalDiff),
    topDiff: r2(best.topDiff),
    distributionDiff: r2(
      best.distributionDiff
    ),
    lineDiff: r2(best.lineDiff),
    positionPenalty: r2(
      best.positionPenalty
    ),
    penalty: r2(best.penalty),
    powerDiffPercent: r2(
      Math.abs(blueTotal - redTotal) /
      Math.max(1, (blueTotal + redTotal) / 2)
      * 100
    ),
    evaluatedCombinations: 126,
  };
}
