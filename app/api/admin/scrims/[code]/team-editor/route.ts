import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ code: string }> };
const POSITIONS = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;
type Position = (typeof POSITIONS)[number];
type Side = "A" | "B";
type Assignment = { userId: string; assignedPosition: Position };
type Member = Assignment & { discordUserId: string; name: string; team: Side };
const respond = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });
function isPosition(value: unknown): value is Position {
  return typeof value === "string" && POSITIONS.includes(value as Position);
}
const editableStatuses = ["CLOSED", "TEAM_SELECTION", "IN_PROGRESS"] as const;

async function load(code: string) {
  return prisma.scrim.findUnique({
    where: { code },
    include: { participants: {
      where: { status: "CONFIRMED" }, orderBy: { joinedAt: "asc" },
      include: { user: { include: { discordAccount: true, riotAccount: true } } },
    } },
  });
}
function fromRecord(value: unknown): { blue: Assignment[]; red: Assignment[] } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { blue?: unknown; red?: unknown };
  if (!Array.isArray(v.blue) || !Array.isArray(v.red)) return null;
  const unpack = (items: unknown[]): Assignment[] => items.map(p => {
    const row = p as { userId?: unknown; assignedPosition?: unknown };
    return { userId: typeof row?.userId === "string" ? row.userId : "", assignedPosition: isPosition(row?.assignedPosition) ? row.assignedPosition : "TOP" };
  });
  return { blue: unpack(v.blue), red: unpack(v.red) };
}

export async function GET(request: NextRequest, { params }: Context) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return respond("관리자 로그인 필요", admin.status);
  const code = (await params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return respond("랭크 내전만 편집할 수 있습니다.", 400);
  const scrim = await load(code);
  if (!scrim || scrim.type !== "RANKED") return respond("내전을 찾지 못했습니다.", 404);
  const log = await prisma.adminAuditLog.findFirst({
    where: { action: "RANKED_TEAM_CONFIRMED", targetType: "Scrim", targetId: scrim.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { afterData: true },
  });
  const previous = fromRecord(log?.afterData);
  const map = new Map<string, { team: Side; position: Position }>();
  for (const [team, list] of [["A", previous?.blue], ["B", previous?.red]] as const) {
    for (const row of list ?? []) map.set(row.userId, { team, position: row.assignedPosition });
  }
  const teamIndex: Record<Side, number> = { A: 0, B: 0 };
  const players = scrim.participants.map((p, index) => {
    const saved = map.get(p.userId);
    const team: Side = p.team === "A" || p.team === "B" ? p.team : saved?.team ?? (index < 5 ? "A" : "B");
    const fallback = POSITIONS[teamIndex[team]++ % 5];
    const position: Position = saved?.position ?? fallback;
    return {
      userId: p.userId, discordUserId: p.user.discordAccount?.discordUserId ?? "",
      name: p.user.riotAccount ? `${p.user.riotAccount.gameName}#${p.user.riotAccount.tagLine}` : p.user.discordAccount?.globalName ?? p.userId,
      team, assignedPosition: position,
    } satisfies Member;
  });
  const hasResults = await prisma.adminAuditLog.count({ where: { action: "TRACKER_SET_RECEIVED", targetType: "Scrim", targetId: scrim.id } });
  return NextResponse.json({ ok: true, code, status: scrim.status,
    editable: editableStatuses.some(s => s === scrim.status) && hasResults === 0 && scrim.participants.length === 10,
    hasResults: hasResults > 0, revision: scrim.updatedAt.toISOString(), players,
    notice: "임시로 6:4 등 자유롭게 이동할 수 있지만 저장 시 두 팀 각 5명, 포지션 5종이 필요합니다. 경기 기록 수집 전까지만 팀을 편집할 수 있습니다.",
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: Context) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return respond("관리자 로그인 필요", admin.status);
  const code = (await params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return respond("랭크 내전만 편집할 수 있습니다.", 400);
  let body: { blue?: Assignment[]; red?: Assignment[]; revision?: string };
  try { body = await request.json(); } catch { return respond("JSON 형식 오류", 400); }
  const blue = body.blue, red = body.red;
  if (!Array.isArray(blue) || !Array.isArray(red) || blue.length !== 5 || red.length !== 5)
    return respond("저장 시 블루팀·레드팀 각각 정확히 5명이 필요합니다.", 400);
  const submitted = [...blue, ...red];
  if (submitted.some(m => !m || typeof m.userId !== "string" || !isPosition(m.assignedPosition)))
    return respond("유효하지 않은 사용자 ID 또는 포지션이 포함되어 있습니다.", 400);
  if (new Set(submitted.map(m => m.userId)).size !== 10)
    return respond("동일 선수를 중복 배정할 수 없습니다.", 400);
  for (const side of [blue, red]) {
    if (new Set(side.map(m => m.assignedPosition)).size !== 5)
      return respond("각 팀은 탑·정글·미드·AD·서폿을 한 명씩 지정해야 합니다.", 400);
  }
  const scrim = await load(code);
  if (!scrim || scrim.type !== "RANKED") return respond("내전을 찾지 못했습니다.", 404);
  if (!editableStatuses.some(s => s === scrim.status)) return respond("현재 상태에서는 팀을 편집할 수 없습니다.", 409);
  if (scrim.participants.length !== 10 || new Set(scrim.participants.map(p => p.userId)).size !== 10)
    return respond("확정 참가자가 정확히 10명이어야 합니다.", 409);
  const actual = new Set(scrim.participants.map(p => p.userId));
  if (submitted.some(m => !actual.has(m.userId))) return respond("명단에 없는 선수가 포함되어 있습니다.", 409);
  if (body.revision !== scrim.updatedAt.toISOString()) return respond("다른 관리자의 변경사항이 있습니다. 새로고침 후 다시 수정해 주세요.", 409);
  const hasResults = await prisma.adminAuditLog.count({ where: { action: "TRACKER_SET_RECEIVED", targetType: "Scrim", targetId: scrim.id } });
  if (hasResults) return respond("이미 세트 기록이 도착한 내전입니다. 결과 보호를 위해 팀 변경이 잠겨 있습니다.", 409);
  const names = new Map(scrim.participants.map(p => [p.userId, {
    discordUserId: p.user.discordAccount?.discordUserId ?? "",
    name: p.user.riotAccount ? `${p.user.riotAccount.gameName}#${p.user.riotAccount.tagLine}` : p.user.discordAccount?.globalName ?? p.userId,
  }]));
  if ([...names.values()].some(p => !p.discordUserId)) return respond("참가자 Discord 계정 연결이 불완전합니다.", 409);
  const toMembers = (arr: Assignment[]): Member[] => arr.map(x => ({ ...x, ...names.get(x.userId)!, team: blue === arr ? "A" : "B" }));
  const after = { blue: toMembers(blue), red: toMembers(red), source: "ADMIN_MANUAL_TEAM_EDIT" };
  try {
    const result = await prisma.$transaction(async tx => {
      const lock = await tx.scrim.updateMany({
        where: { id: scrim.id, updatedAt: scrim.updatedAt, status: scrim.status },
        data: { status: scrim.status === "CLOSED" ? "TEAM_SELECTION" : scrim.status },
      });
      if (lock.count !== 1) throw new Error("STALE_TEAM_EDITOR");
      const stillResults = await tx.adminAuditLog.count({ where: { action: "TRACKER_SET_RECEIVED", targetType: "Scrim", targetId: scrim.id } });
      if (stillResults) throw new Error("SET_RECORD_ALREADY_RECEIVED");
      const updates = await Promise.all([
        tx.scrimParticipant.updateMany({ where: { scrimId: scrim.id, status: "CONFIRMED", userId: { in: blue.map(x => x.userId) } }, data: { team: "A" } }),
        tx.scrimParticipant.updateMany({ where: { scrimId: scrim.id, status: "CONFIRMED", userId: { in: red.map(x => x.userId) } }, data: { team: "B" } }),
      ]);
      if (updates.some(x => x.count !== 5)) throw new Error("TEAM_ROSTER_CHANGED");
      await tx.adminAuditLog.create({ data: {
        adminId: admin.user?.id ?? null,
        action: "RANKED_TEAM_CONFIRMED", targetType: "Scrim", targetId: scrim.id,
        reason: "관리자 자유 팀·라인 편집", afterData: after,
        beforeData: { code, status: scrim.status, assignments: scrim.participants.map(p => ({ userId: p.userId, team: p.team })) },
      } });
      return { status: scrim.status === "CLOSED" ? "TEAM_SELECTION" : scrim.status };
    });
    return NextResponse.json({ ok: true, code, status: result.status, message: "저장 완료. Discord 모집글과 DM은 봇 동기화 시 갱신됩니다." });
  } catch (e) {
    console.error("RANKED_MANUAL_TEAM_EDIT_FAILED", code, e);
    return respond("동시에 팀 또는 경기 기록이 변경됐습니다. 새로고침 후 다시 확인해 주세요.", 409);
  }
}
