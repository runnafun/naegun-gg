export type TierInput = {
  tier?: string | null;
  rank?: string | null;
  lp?: number | null;
};

export type BalancePlayer = {
  userId: string;
  name: string;

  currentTier: TierInput;
  peakTier: TierInput;

  tierEvaluation: number;
  scrimRankScore: number;
};

export type RatedPlayer =
  BalancePlayer & {
    currentTierScore: number;
    peakTierScore: number;
    br: number;
  };

export type TeamBalanceResult = {
  blue: RatedPlayer[];
  red: RatedPlayer[];

  blueTotal: number;
  redTotal: number;

  totalDiff: number;
  topDiff: number;
  distributionDiff: number;
  penalty: number;

  powerDiffPercent: number;

  evaluatedCombinations: number;
};

const TIER_BASE: Record<string, number> = {
  IRON: 10,
  BRONZE: 20,
  SILVER: 30,
  GOLD: 40,
  PLATINUM: 50,
  EMERALD: 60,
  DIAMOND: 70,
  MASTER: 85,
  GRANDMASTER: 92,
  CHALLENGER: 100,
};

const DIVISION_OFFSET: Record<string, number> = {
  IV: 0,
  III: 2.5,
  II: 5,
  I: 7.5,
};

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export function tierToScore(
  input: TierInput,
) {
  const tier =
    input.tier?.toUpperCase() ?? "";

  if (!tier || tier === "UNRANKED") {
    return 0;
  }

  const base =
    TIER_BASE[tier] ?? 0;

  if (
    tier === "MASTER" ||
    tier === "GRANDMASTER" ||
    tier === "CHALLENGER"
  ) {
    // 상위 티어는 LP를 소폭 반영.
    // 최대 +7점까지만 반영해 과도한 LP 편향을 방지.
    const lpBonus = Math.min(
      Math.max(input.lp ?? 0, 0) / 150,
      7,
    );

    return clamp(base + lpBonus);
  }

  const division =
    DIVISION_OFFSET[
      input.rank?.toUpperCase() ?? ""
    ] ?? 0;

  // 한 division 내부 LP는 최대 2.4점 반영
  const lpBonus =
    clamp(input.lp ?? 0, 0, 99) /
    100 *
    2.4;

  return clamp(
    base + division + lpBonus,
  );
}

export function calculateBR(
  player: BalancePlayer,
): RatedPlayer {
  const currentTierScore =
    tierToScore(player.currentTier);

  const peakTierScore =
    tierToScore(player.peakTier);

  const tierEvaluation =
    clamp(player.tierEvaluation);

  const scrimRankScore =
    clamp(player.scrimRankScore);

  const br =
    tierEvaluation * 0.45 +
    currentTierScore * 0.25 +
    peakTierScore * 0.15 +
    scrimRankScore * 0.15;

  return {
    ...player,
    currentTierScore,
    peakTierScore,
    br,
  };
}

function sum(
  values: number[],
) {
  return values.reduce(
    (acc, value) => acc + value,
    0,
  );
}

function average(
  values: number[],
) {
  if (!values.length) return 0;
  return sum(values) / values.length;
}

function stdDev(
  values: number[],
) {
  if (!values.length) return 0;

  const mean = average(values);

  return Math.sqrt(
    average(
      values.map(
        (value) =>
          (value - mean) ** 2,
      ),
    ),
  );
}

function combinations(
  values: number[],
  count: number,
): number[][] {
  const result: number[][] = [];

  const pick = (
    start: number,
    current: number[],
  ) => {
    if (current.length === count) {
      result.push([...current]);
      return;
    }

    for (
      let i = start;
      i <=
      values.length -
        (count - current.length);
      i++
    ) {
      current.push(values[i]);
      pick(i + 1, current);
      current.pop();
    }
  };

  pick(0, []);
  return result;
}

function indicatorDiff(
  blue: RatedPlayer[],
  red: RatedPlayer[],
  selector: (
    player: RatedPlayer,
  ) => number,
) {
  return Math.abs(
    sum(blue.map(selector)) -
      sum(red.map(selector)),
  );
}

function candidateKey(
  blue: RatedPlayer[],
  red: RatedPlayer[],
) {
  const blueBr =
    blue.map((p) => p.br);
  const redBr =
    red.map((p) => p.br);

  const totalDiff =
    Math.abs(
      sum(blueBr) - sum(redBr),
    );

  const topDiff =
    Math.abs(
      Math.max(...blueBr) -
        Math.max(...redBr),
    );

  const distributionDiff =
    Math.abs(
      stdDev(blueBr) -
        stdDev(redBr),
    );

  const penalty =
    totalDiff * 0.65 +
    topDiff * 0.20 +
    distributionDiff * 0.15;

  // 공식 4순위 tie-break
  const tierEvaluationDiff =
    indicatorDiff(
      blue,
      red,
      (p) => p.tierEvaluation,
    );

  const currentTierDiff =
    indicatorDiff(
      blue,
      red,
      (p) => p.currentTierScore,
    );

  const peakTierDiff =
    indicatorDiff(
      blue,
      red,
      (p) => p.peakTierScore,
    );

  const scrimRankDiff =
    indicatorDiff(
      blue,
      red,
      (p) => p.scrimRankScore,
    );

  return {
    penalty,
    totalDiff,
    topDiff,
    distributionDiff,
    tierEvaluationDiff,
    currentTierDiff,
    peakTierDiff,
    scrimRankDiff,
  };
}

function compareCandidate(
  a: ReturnType<typeof candidateKey>,
  b: ReturnType<typeof candidateKey>,
) {
  const keys: Array<
    keyof ReturnType<typeof candidateKey>
  > = [
    "penalty",
    "totalDiff",
    "topDiff",
    "distributionDiff",
    "tierEvaluationDiff",
    "currentTierDiff",
    "peakTierDiff",
    "scrimRankDiff",
  ];

  for (const key of keys) {
    const diff = a[key] - b[key];

    if (Math.abs(diff) > 1e-9) {
      return diff;
    }
  }

  return 0;
}

export function balanceTeams(
  input: BalancePlayer[],
): TeamBalanceResult {
  if (input.length !== 10) {
    throw new Error(
      `자동 팀 배정은 확정 참가자 10명이 필요합니다. 현재 ${input.length}명`,
    );
  }

  const players =
    input.map(calculateBR);

  const allIndexes =
    players.map((_, index) => index);

  // BLUE에 0번 플레이어를 항상 포함시켜
  // BLUE/RED 뒤집기 중복을 제거.
  // C(9,4) = 126개만 평가.
  const remaining =
    allIndexes.slice(1);

  const blueRest =
    combinations(remaining, 4);

  let best:
    | {
        blue: RatedPlayer[];
        red: RatedPlayer[];
        key: ReturnType<
          typeof candidateKey
        >;
      }
    | null = null;

  for (const rest of blueRest) {
    const blueIndexSet =
      new Set([0, ...rest]);

    const blue =
      players.filter((_, index) =>
        blueIndexSet.has(index),
      );

    const red =
      players.filter((_, index) =>
        !blueIndexSet.has(index),
      );

    const key =
      candidateKey(blue, red);

    if (
      !best ||
      compareCandidate(
        key,
        best.key,
      ) < 0
    ) {
      best = {
        blue,
        red,
        key,
      };
    }
  }

  if (!best) {
    throw new Error(
      "팀 조합 계산에 실패했습니다.",
    );
  }

  const blueTotal =
    sum(best.blue.map((p) => p.br));

  const redTotal =
    sum(best.red.map((p) => p.br));

  const avgTotal =
    (blueTotal + redTotal) / 2;

  const powerDiffPercent =
    avgTotal > 0
      ? Math.abs(
          blueTotal - redTotal,
        ) /
        avgTotal *
        100
      : 0;

  return {
    blue: best.blue,
    red: best.red,

    blueTotal,
    redTotal,

    totalDiff: best.key.totalDiff,
    topDiff: best.key.topDiff,
    distributionDiff:
      best.key.distributionDiff,

    penalty: best.key.penalty,

    powerDiffPercent,

    evaluatedCombinations:
      blueRest.length,
  };
}
