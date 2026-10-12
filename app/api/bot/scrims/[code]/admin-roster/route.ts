import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ code: string }> };
type Member = { discordUserId: string; gameName?: string; tagLine?: string; status: "CONFIRMED" | "WAITING" };
type Change = { action: string; discordUserId: string; error?: string };
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });
const editable = (status: string) => ["OPEN", "CLOSED", "TEAM_SELECTION"].includes(status);

function isValidMember(p: unknown): p is Member {
  if (!p || typeof p !== "object") return false;
  const m = p as Partial<Member>;
  return typeof m.discordUserId === "string" && /^\d{15,21}$/.test(m.discordUserId) &&
    (m.status === "CONFIRMED" || m.status === "WAITING") &&
    (m.gameName === undefined || (typeof m.gameName === "string" && m.gameName.length <= 100)) &&
    (m.tagLine === undefined || (typeof m.tagLine === "string" && m.tagLine.length <= 100));
}

export async function POST(request: NextRequest, { params }: Params) {
  if (!isValidBotRequest(request)) return fail("UNAUTHORIZED", 401);
  const code = (await params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return fail("INVALID_CODE", 400);
  const scrim = await prisma.scrim.findUnique({ where: { code }, select: { id: true, status: true, type: true } });
  if (!scrim || scrim.type !== "RANKED") return fail("SCRIM_NOT_FOUND", 404);
  if (!editable(scrim.status)) return NextResponse.json({ ok: true, removedDiscordUserIds: [], pendingAdditions: [], editable: false });

  let body: { action?: string; members?: unknown; discordUserId?: string; status?: string; reason?: string };
  try { body = await request.json(); } catch { return fail("INVALID_JSON", 400); }

  // ACK는 Discord 봇이 길드 멤버를 검증하고, 로컬+RDS 명단 동기화를 마친 뒤에만 호출한다.
  if (body.action === "ACK_ADD") {
    const id = String(body.discordUserId ?? "");
    if (!/^\d{15,21}$/.test(id) || !["SUCCEEDED", "FAILED"].includes(String(body.status))) return fail("INVALID_ACK", 400);
    const history = await prisma.adminAuditLog.findMany({
      where: { targetType: "Scrim", targetId: scrim.id, action: { in: ["RANKED_ADMIN_PARTICIPANT_ADD_REQUESTED", "RANKED_ADMIN_PARTICIPANT_ADDED", "RANKED_ADMIN_PARTICIPANT_ADD_FAILED", "RANKED_ADMIN_PARTICIPANT_REMOVED"] } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { action: true, afterData: true },
    });
    let latest = "";
    for (const log of history) {
      if ((log.afterData as { discordUserId?: string } | null)?.discordUserId === id) latest = log.action;
    }
    if (latest !== "RANKED_ADMIN_PARTICIPANT_ADD_REQUESTED") return fail("ADD_REQUEST_NOT_PENDING", 409);
    const ok = body.status === "SUCCEEDED";
    await prisma.adminAuditLog.create({ data: {
      action: ok ? "RANKED_ADMIN_PARTICIPANT_ADDED" : "RANKED_ADMIN_PARTICIPANT_ADD_FAILED",
      targetType: "Scrim", targetId: scrim.id,
      reason: ok ? "봇 참가자 추가/동기화 완료" : String(body.reason ?? "추가 실패").slice(0, 140),
      afterData: { discordUserId: id, code, ...(ok ? {} : { error: String(body.reason ?? "추가 실패").slice(0, 140) }) },
    } });
    return NextResponse.json({ ok: true, code, applied: ok });
  }

  if (!Array.isArray(body.members) || body.members.length > 100 || !body.members.every(isValidMember)) return fail("INVALID_ROSTER", 400);
  const members = (body.members as Member[]).sort((a, b) => a.discordUserId.localeCompare(b.discordUserId));
  if (new Set(members.map(m => m.discordUserId)).size !== members.length) return fail("DUPLICATE_MEMBER", 400);
  const [last, changes] = await Promise.all([
    prisma.adminAuditLog.findFirst({ where: { action: "RANKED_BOT_ROSTER_SNAPSHOT", targetType: "Scrim", targetId: scrim.id }, orderBy: { createdAt: "desc" } }),
    prisma.adminAuditLog.findMany({
      where: { action: { in: ["RANKED_ADMIN_PARTICIPANT_REMOVED", "RANKED_ADMIN_PARTICIPANT_ADD_REQUESTED", "RANKED_ADMIN_PARTICIPANT_ADDED", "RANKED_ADMIN_PARTICIPANT_ADD_FAILED"] }, targetType: "Scrim", targetId: scrim.id },
      select: { action: true, afterData: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  ]);
  const previous = last?.afterData as { members?: Member[] } | null;
  if (JSON.stringify(previous?.members ?? null) !== JSON.stringify(members)) {
    await prisma.adminAuditLog.create({ data: { action: "RANKED_BOT_ROSTER_SNAPSHOT", targetType: "Scrim", targetId: scrim.id, afterData: { members } } });
  }
  const states = new Map<string, Change>();
  for (const c of changes) {
    const d = c.afterData as { discordUserId?: string; error?: string } | null;
    if (d?.discordUserId) states.set(d.discordUserId, { action: c.action, discordUserId: d.discordUserId, error: d.error });
  }
  const removedDiscordUserIds = [...states.values()].filter(s => s.action === "RANKED_ADMIN_PARTICIPANT_REMOVED").map(s => s.discordUserId);
  const pendingAdditions = [...states.values()].filter(s => s.action === "RANKED_ADMIN_PARTICIPANT_ADD_REQUESTED").map(s => s.discordUserId);
  return NextResponse.json({ ok: true, code, removedDiscordUserIds, pendingAdditions, editable: true });
}
