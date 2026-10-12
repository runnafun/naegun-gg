import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
import {
  adjustedAbsoluteLp, absoluteLpLabel, baseTierLabel, BALANCE_TIER_NAMES,
  BALANCE_DIVISIONS, tierToAbsoluteLp, type BalanceTier,
} from "@/app/lib/balance-lp";

export const dynamic = "force-dynamic";
function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}
const columns = { select: {
  id: true, status: true,
  riotAccount: { select: { gameName: true, tagLine: true, soloTier: true, soloRank: true, soloLp: true } },
  discordAccount: { select: { username: true, globalName: true } },
  balanceProfile: { select: {
    peakTier: true, peakRank: true, peakLp: true, tierEvaluation: true,
    evaluationLpOffset: true, evaluationBaseTier: true, evaluationBaseRank: true, evaluationBaseLp: true,
  } },
} } as const;

type UserRow = Awaited<ReturnType<typeof getUsers>>[number];
async function getUsers(keyword: string) {
  const where = keyword ? { OR: [
    { riotAccount: { is: { gameName: { contains: keyword, mode: "insensitive" as const } } } },
    { riotAccount: { is: { tagLine: { contains: keyword, mode: "insensitive" as const } } } },
    { discordAccount: { is: { username: { contains: keyword, mode: "insensitive" as const } } } },
    { discordAccount: { is: { globalName: { contains: keyword, mode: "insensitive" as const } } } },
    { discordAccount: { is: { discordUserId: { contains: keyword } } } },
  ] } : {};
  return prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, ...columns });
}
function present(u: UserRow) {
  const r = u.riotAccount;
  const p = u.balanceProfile;
  const current: BalanceTier = { tier: r?.soloTier, rank: r?.soloRank, lp: r?.soloLp };
  const manualBase: BalanceTier | null = p?.evaluationBaseTier
    ? { tier: p.evaluationBaseTier, rank: p.evaluationBaseRank, lp: p.evaluationBaseLp }
    : null;
  const effectiveBase = manualBase ?? current;
  const offset = p?.evaluationLpOffset ?? 0;
  const effective = adjustedAbsoluteLp(effectiveBase, offset);
  return {
    id: u.id, status: u.status,
    name: r ? `${r.gameName}#${r.tagLine}` : "Riot 미연동",
    discord: u.discordAccount?.globalName || u.discordAccount?.username || "Discord 미연동",
    current, manualBase,
    peak: { tier: p?.peakTier, rank: p?.peakRank, lp: p?.peakLp },
    evaluationLpOffset: offset,
    effectiveLp: effective,
    effectiveLabel: absoluteLpLabel(effective),
    baseLabel: baseTierLabel(effectiveBase),
    legacyEvaluation: p?.tierEvaluation ?? null,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return fail("관리자 인증이 필요합니다.", auth.status);
  try {
    const q = (new URL(request.url).searchParams.get("q") || "").trim().slice(0, 70);
    return NextResponse.json({
      ok: true, members: (await getUsers(q)).map(present),
      formula: "현재 솔로랭크 누적 LP + 관리자 보정 LP (탑레/방패/보호 게이지 미포함)",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("ADMIN_BALANCE_LP_GET", err);
    return fail("티어 평가 조회 실패", 500);
  }
}

function parseManualBase(v: unknown): BalanceTier | null | "INVALID" {
  if (v === null) return null;
  if (!v || typeof v !== "object") return "INVALID";
  const value = v as Record<string, unknown>;
  const tier = String(value.tier || "").toUpperCase();
  const rank = value.rank == null ? null : String(value.rank).toUpperCase();
  const lp = Number(value.lp);
  if (!BALANCE_TIER_NAMES.includes(tier) || !Number.isInteger(lp) || lp < 0 || lp > 100000) return "INVALID";
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) {
    if (rank !== null && rank !== "") return "INVALID";
    return { tier, rank: null, lp };
  }
  if (!BALANCE_DIVISIONS.includes(rank as "IV"|"III"|"II"|"I") || lp >= 100) return "INVALID";
  return { tier, rank, lp };
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return fail("관리자 인증이 필요합니다.", auth.status);
  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : "";
  const hasDelta = typeof body?.delta === "number";
  const hasSet = typeof body?.evaluationLpOffset === "number";
  if (!userId || !note || hasDelta === hasSet) return fail("회원·변경 사유·보정 LP를 확인해 주세요.");
  const change = hasDelta ? body.delta : body.evaluationLpOffset;
  if (!Number.isSafeInteger(change) || Math.abs(change) > 1000000) return fail("보정 LP는 정수로 입력해 주세요.");
  const replaceBase = Object.prototype.hasOwnProperty.call(body, "manualBase");
  const parsedBase = replaceBase ? parseManualBase(body.manualBase) : null;
  if (parsedBase === "INVALID") return fail("수동 기준 티어·단계·LP 입력값이 올바르지 않습니다.");
  try {
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { riotAccount: true, balanceProfile: true } });
      if (!user) throw new Error("MEMBER_NOT_FOUND");
      const old = user.balanceProfile;
      const beforeLp = old?.evaluationLpOffset ?? 0;
      const nextLp = hasDelta ? beforeLp + change : change;
      if (!Number.isSafeInteger(nextLp) || Math.abs(nextLp) > 1000000) throw new Error("LP_OUT_OF_RANGE");
      const baseTier = replaceBase ? parsedBase?.tier ?? null : old?.evaluationBaseTier ?? null;
      const baseRank = replaceBase ? parsedBase?.rank ?? null : old?.evaluationBaseRank ?? null;
      const baseLp = replaceBase ? parsedBase?.lp ?? null : old?.evaluationBaseLp ?? null;
      const current = { tier: user.riotAccount?.soloTier, rank: user.riotAccount?.soloRank, lp: user.riotAccount?.soloLp };
      const currentBase = baseTier ? { tier: baseTier, rank: baseRank, lp: baseLp } : current;
      if (tierToAbsoluteLp(currentBase) === null) throw new Error("NO_VALID_BASE_TIER");
      const before = {
        evaluationLpOffset: beforeLp,
        evaluationBaseTier: old?.evaluationBaseTier ?? null,
        evaluationBaseRank: old?.evaluationBaseRank ?? null,
        evaluationBaseLp: old?.evaluationBaseLp ?? null,
      };
      const after = {
        evaluationLpOffset: nextLp,
        evaluationBaseTier: baseTier, evaluationBaseRank: baseRank, evaluationBaseLp: baseLp,
      };
      if (JSON.stringify(before) === JSON.stringify(after)) return { changed: false, evaluationLpOffset: nextLp, effectiveLabel: absoluteLpLabel(adjustedAbsoluteLp(currentBase, nextLp)) };
      await tx.balanceProfile.upsert({
        where: { userId },
        create: { userId, ...after, scrimRankScore: 50 },
        update: after,
      });
      await tx.adminAuditLog.create({ data: {
        adminId: auth.user.id,
        action: "ADMIN_BALANCE_LP_UPDATED",
        targetType: "User", targetId: userId, beforeData: before, afterData: after, reason: note,
      } });
      return { changed: true, evaluationLpOffset: nextLp, effectiveLabel: absoluteLpLabel(adjustedAbsoluteLp(currentBase, nextLp)) };
    });
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const e = err instanceof Error ? err.message : "";
    if (e === "MEMBER_NOT_FOUND") return fail("회원을 찾을 수 없습니다.", 404);
    if (e === "NO_VALID_BASE_TIER") return fail("솔로랭크 정보가 없습니다. 먼저 수동 기준 티어를 지정해 주세요.");
    if (e === "LP_OUT_OF_RANGE") return fail("보정 LP 범위가 너무 큽니다.");
    console.error("ADMIN_BALANCE_LP_POST", err);
    return fail("보정 LP 저장 실패", 500);
  }
}
