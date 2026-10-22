import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ code: string }> };
const TERMINABLE_STATUSES = ["OPEN", "CLOSED", "TEAM_SELECTION", "IN_PROGRESS"];
const response = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

async function loadState(code: string) {
  const scrim = await prisma.scrim.findUnique({
    where: { code },
    select: { id: true, code: true, type: true, status: true, finishedAt: true },
  });
  if (!scrim) return null;
  const [rankSettlement, trackerSets, rewards, gameRecords] = await Promise.all([
    prisma.adminAuditLog.count({ where: { targetType: "Scrim", targetId: scrim.id, action: "RANKED_SETTLED" } }),
    prisma.adminAuditLog.count({ where: { targetType: "Scrim", targetId: scrim.id, action: "TRACKER_SET_RECEIVED" } }),
    prisma.walletTransaction.count({ where: { scrimId: scrim.id } }),
    prisma.game.count({ where: { scrimId: scrim.id } }),
  ]);
  return { scrim, rankSettlement, trackerSets, rewards, gameRecords };
}

export async function GET(request: NextRequest, context: Context) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return response("관리자 로그인이 필요합니다.", admin.status);
  const code = (await context.params).code.trim().toUpperCase();
  if (!/^[RN]\d{3,}$/.test(code)) return response("내전 코드가 올바르지 않습니다.", 400);
  const state = await loadState(code);
  if (!state) return response("내전을 찾을 수 없습니다.", 404);
  const { scrim, rankSettlement, trackerSets, rewards, gameRecords } = state;
  const eligible = TERMINABLE_STATUSES.includes(scrim.status) && !scrim.finishedAt &&
    rankSettlement === 0 && trackerSets === 0 && rewards === 0 && gameRecords === 0;
  const blockReason = !TERMINABLE_STATUSES.includes(scrim.status) ?
    `현재 DB 상태가 ${scrim.status}이므로 기록 없이 종료할 수 없습니다.` :
    scrim.finishedAt ? "완료 처리된 내전은 기록 없이 강제 종료할 수 없습니다." :
    rankSettlement > 0 ? "기존 정산 내역이 있어 강제 종료할 수 없습니다." :
    trackerSets > 0 ? "이미 수집된 트래커 세트가 있어 강제 종료할 수 없습니다." :
    rewards > 0 ? "이미 지급된 GG코인이 있어 강제 종료할 수 없습니다." :
    gameRecords > 0 ? "이미 생성된 경기 기록이 있어 강제 종료할 수 없습니다." : null;
  return NextResponse.json({ ok: true, code, type: scrim.type, status: scrim.status, eligible, blockReason,
    checks: { rankSettlement, trackerSets, rewards, gameRecords },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: Context) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return response("관리자 로그인이 필요합니다.", admin.status);
  const code = (await context.params).code.trim().toUpperCase();
  if (!/^[RN]\d{3,}$/.test(code)) return response("내전 코드가 올바르지 않습니다.", 400);
  let body: { confirmCode?: unknown; reason?: unknown };
  try { body = await request.json(); }
  catch { return response("요청 형식이 올바르지 않습니다.", 400); }
  if (body.confirmCode !== code) return response("강제 종료할 내전 코드를 정확히 입력해 주세요.", 400);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 200) return response("사유는 5~200자로 입력해 주세요.", 400);

  try {
    const result = await prisma.$transaction(async tx => {
      const scrim = await tx.scrim.findUnique({ where: { code },
        select: { id: true, code: true, type: true, status: true, finishedAt: true } });
      if (!scrim) throw new Error("NOT_FOUND");
      if (!TERMINABLE_STATUSES.includes(scrim.status) || scrim.finishedAt) throw new Error("NOT_TERMINABLE");
      // 조건부 갱신. 다른 관리자나 정산 작업과 충돌하면 롤백한다.
      const lock = await tx.scrim.updateMany({
        where: { id: scrim.id, status: scrim.status, finishedAt: null },
        data: { status: "CANCELLED" },
      });
      if (lock.count !== 1) throw new Error("STATUS_CHANGED");
      const [rankSettlement, trackerSets, rewards, gameRecords] = await Promise.all([
        tx.adminAuditLog.count({ where: { targetType: "Scrim", targetId: scrim.id, action: "RANKED_SETTLED" } }),
        tx.adminAuditLog.count({ where: { targetType: "Scrim", targetId: scrim.id, action: "TRACKER_SET_RECEIVED" } }),
        tx.walletTransaction.count({ where: { scrimId: scrim.id } }),
        tx.game.count({ where: { scrimId: scrim.id } }),
      ]);
      if (rankSettlement || trackerSets || rewards || gameRecords) throw new Error("EXISTING_RESULTS_OR_REWARDS");
      await tx.adminAuditLog.create({ data: {
        adminId: admin.user.id,
        action: "SCRIM_FORCE_CANCEL_UNTRACKED",
        targetType: "Scrim", targetId: scrim.id,
        beforeData: { code, status: scrim.status },
        afterData: { code, status: "CANCELLED", settlement: false, rankedPoints: false, ggCoins: false },
        reason,
      } });
      return { code, status: "CANCELLED" as const };
    }, { maxWait: 10000, timeout: 20000 });
    return NextResponse.json({ ok: true, ...result,
      message: `${code} 기록 없이 강제 종료 완료. 승패·랭크 점수·GG코인은 지급하지 않았습니다.`,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const kind = error instanceof Error ? error.message : "";
    if (kind === "NOT_FOUND") return response("내전을 찾을 수 없습니다.", 404);
    if (kind === "NOT_TERMINABLE" || kind === "STATUS_CHANGED")
      return response("이미 종료됐거나 상태가 변경됐습니다. 페이지를 새로고침해 주세요.", 409);
    if (kind === "EXISTING_RESULTS_OR_REWARDS")
      return response("기존 경기 기록·트래커 수집·정산·지급 내역이 있어 강제 종료할 수 없습니다.", 409);
    console.error("SCRIM_FORCE_END", error);
    return response("강제 종료 처리에 실패했습니다. 서버 로그를 확인해 주세요.", 500);
  }
}
