import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";

const POSITIONS = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT", "ANY"] as const;
type Position = (typeof POSITIONS)[number];
type RankRosterMember = {
  discordUserId: string;
  puuid: string;
  mainPosition: Position;
  subPosition: Position;
  status: "CONFIRMED" | "WAITING";
};

const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

function isMember(value: unknown): value is RankRosterMember {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<RankRosterMember>;
  return typeof p.discordUserId === "string" && /^\d{15,21}$/.test(p.discordUserId) &&
    typeof p.puuid === "string" && p.puuid.trim().length > 0 &&
    POSITIONS.includes(p.mainPosition as Position) &&
    POSITIONS.includes(p.subPosition as Position) &&
    (p.status === "CONFIRMED" || p.status === "WAITING") &&
    (p.mainPosition === "ANY" || p.mainPosition !== p.subPosition);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!isValidBotRequest(request)) return fail("UNAUTHORIZED", 401);
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return fail("RANKED_CODE_REQUIRED", 400);

  let body: { participants?: unknown };
  try { body = await request.json(); }
  catch { return fail("INVALID_JSON", 400); }
  if (!Array.isArray(body?.participants) ||
      body.participants.length > 200 || !body.participants.every(isMember)) {
    return fail("INVALID_ROSTER", 400);
  }
  const members = body.participants as RankRosterMember[];
  const confirmed = members.filter(m => m.status === "CONFIRMED");
  if (confirmed.length > 10) return fail("MAX_TEN_CONFIRMED_PLAYERS", 409);

  const discordIds = members.map(m => m.discordUserId);
  const puuids = members.map(m => m.puuid);
  if (new Set(discordIds).size !== discordIds.length || new Set(puuids).size !== puuids.length)
    return fail("DUPLICATE_DISCORD_OR_RIOT_ACCOUNT", 409);

  const scrim = await prisma.scrim.findUnique({ where: { code }, select: { id: true, type: true, status: true } });
  if (!scrim || scrim.type !== "RANKED") return fail("RANKED_SCRIM_NOT_FOUND", 404);
  if (!["OPEN", "CLOSED", "TEAM_SELECTION"].includes(scrim.status))
    return fail("SCRIM_ALREADY_STARTED_OR_FINISHED", 409);

  const removals = await prisma.adminAuditLog.findMany({
    where: { action: "RANKED_ADMIN_PARTICIPANT_REMOVED", targetType: "Scrim", targetId: scrim.id },
    select: { afterData: true },
  });
  const blocked = new Set(removals.map(x => (x.afterData as { discordUserId?: string } | null)?.discordUserId));
  if (members.some(m => blocked.has(m.discordUserId)))
    return fail("ADMIN_REMOVED_PARTICIPANT_REFRESH_REQUIRED", 409);

  const accounts = discordIds.length ? await prisma.discordAccount.findMany({
    where: { discordUserId: { in: discordIds } },
    include: { user: { include: { riotAccount: true } } },
  }) : [];
  const accountsByDiscord = new Map(accounts.map(a => [a.discordUserId, a]));
  const missing = discordIds.filter(id => !accountsByDiscord.has(id));
  if (missing.length) return fail("RDS_USERS_NOT_REGISTERED", 409, { missingDiscordUserIds: missing });
  const inactive = discordIds.filter(id => accountsByDiscord.get(id)?.user.status !== "ACTIVE");
  if (inactive.length) return fail("USER_NOT_ACTIVE", 409, { discordUserIds: inactive });
  const wrongRiot = members.filter(m => accountsByDiscord.get(m.discordUserId)?.user.riotAccount?.puuid !== m.puuid)
    .map(m => m.discordUserId);
  if (wrongRiot.length) return fail("RDS_RIOT_ACCOUNT_MISMATCH", 409, { discordUserIds: wrongRiot });
  const userIds = members.map(m => accountsByDiscord.get(m.discordUserId)!.userId);
  if (new Set(userIds).size !== userIds.length) return fail("DUPLICATE_RDS_USER", 409);

  try {
    const result = await prisma.$transaction(async tx => {
      const latest = await tx.scrim.findUnique({ where: { id: scrim.id }, select: { type: true, status: true } });
      if (!latest || latest.type !== "RANKED" || !["OPEN", "CLOSED", "TEAM_SELECTION"].includes(latest.status))
        throw new Error("SCRIM_STATE_CHANGED");

      // Discord 명단에서 빠진 사람은 완전히 삭제하지 않고 취소 상태로 기록
      const canceled = await tx.scrimParticipant.updateMany({
        where: {
          scrimId: scrim.id,
          status: { in: ["CONFIRMED", "WAITING"] },
          ...(userIds.length ? { userId: { notIn: userIds } } : {}),
        },
        data: { status: "CANCELLED", team: null },
      });
      for (const m of members) {
        const userId = accountsByDiscord.get(m.discordUserId)!.userId;
        await tx.scrimParticipant.upsert({
          where: { scrimId_userId: { scrimId: scrim.id, userId } },
          create: { scrimId: scrim.id, userId, status: m.status, mainPosition: m.mainPosition, subPosition: m.subPosition },
          update: { status: m.status, mainPosition: m.mainPosition, subPosition: m.subPosition },
        });
      }
      const confirmedCount = await tx.scrimParticipant.count({ where: { scrimId: scrim.id, status: "CONFIRMED" } });
      const waitingCount = await tx.scrimParticipant.count({ where: { scrimId: scrim.id, status: "WAITING" } });
      if (confirmedCount !== confirmed.length || waitingCount !== members.length - confirmed.length || confirmedCount > 10)
        throw new Error("ROSTER_SNAPSHOT_COUNT_MISMATCH");
      return { confirmedCount, waitingCount, cancelledCount: canceled.count };
    });
    return NextResponse.json({ ok: true, code, ...result });
  } catch (error) {
    console.error("RANKED_ROSTER_SYNC_FAILED", code, error);
    return fail(error instanceof Error && error.message === "SCRIM_STATE_CHANGED" ?
      "SCRIM_STATE_CHANGED" : "RANKED_ROSTER_SYNC_FAILED", 409);
  }
}