/** 내전 팀 밸런스 전용 LP 환산. 방패·보호 게이지·MVP·ACE는 계산하지 않는다. */
export type BalanceTier = { tier?: string | null; rank?: string | null; lp?: number | null };
const ORDER = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"] as const;
const DIVS = ["IV", "III", "II", "I"] as const;
const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);
const LABELS: Record<string, string> = {
  IRON:"아이언",BRONZE:"브론즈",SILVER:"실버",GOLD:"골드",
  PLATINUM:"플래티넘",EMERALD:"에메랄드",DIAMOND:"다이아몬드",
  MASTER:"마스터",GRANDMASTER:"그랜드마스터",CHALLENGER:"챌린저",
};

/** 아이언 IV 0LP를 0으로 하는 누적 LP. 실측 솔랭이 없으면 null. */
export function tierToAbsoluteLp(input: BalanceTier): number | null {
  const tier = String(input.tier || "").toUpperCase();
  const lp = Number(input.lp ?? 0);
  if (!Number.isFinite(lp) || lp < 0) return null;
  if (APEX.has(tier)) return 2800 + Math.trunc(lp);
  const t = ORDER.indexOf(tier as typeof ORDER[number]);
  const d = DIVS.indexOf(String(input.rank || "").toUpperCase() as typeof DIVS[number]);
  if (t < 0 || d < 0) return null;
  // Riot 100LP 구간 기준 (승급전 및 실제 MMR과는 별개).
  return t * 400 + d * 100 + Math.trunc(lp);
}

export function adjustedAbsoluteLp(base: BalanceTier, offset: number): number | null {
  const score = tierToAbsoluteLp(base);
  if (score === null || !Number.isFinite(offset)) return null;
  return Math.max(0, score + Math.trunc(offset));
}

export function absoluteLpLabel(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return "기준 티어 필요";
  const n = Math.max(0, Math.trunc(score));
  if (n >= 2800) return `마스터 환산 ${n - 2800}LP`;
  const t = Math.floor(n / 400);
  const d = Math.floor((n % 400) / 100);
  return `${LABELS[ORDER[t]]} ${DIVS[d]} ${n % 100}LP`;
}

export function baseTierLabel(tier: BalanceTier): string {
  const key = String(tier.tier || "").toUpperCase();
  if (!key) return "솔로랭크 정보 없음";
  return `${LABELS[key] || key} ${APEX.has(key) ? "" : (tier.rank || "")} ${tier.lp ?? 0}LP`.replace(/\s+/g, " ").trim();
}
export const BALANCE_TIER_NAMES = [
  ...ORDER, "MASTER", "GRANDMASTER", "CHALLENGER",
] as readonly string[];
export const BALANCE_DIVISIONS = DIVS;
