import { prisma } from "@/app/lib/prisma";

// A successful tracker code connection is valid only while its owner stays online.
// This audit entry has no settlement or ranking side effects.
export const TRACKER_CONNECTION_TTL_MS = 60_000;
export const TRACKER_CONNECTION_ACTION = "TRACKER_CONNECTED_PRECONFIRM";

type Presence = { userId?: string; discordUserId?: string; connectedAt?: string };

export async function getTrackerConnection(
  scrimId: string, allowedUserIds: string[], db: Pick<typeof prisma, "adminAuditLog"> = prisma
) {
  const entry = await db.adminAuditLog.findFirst({
    where: { action: TRACKER_CONNECTION_ACTION, targetType: "Scrim", targetId: scrimId },
    orderBy: { createdAt: "desc" },
    select: { afterData: true },
  });
  const data = entry?.afterData as Presence | null;
  const stamp = Date.parse(String(data?.connectedAt ?? ""));
  const connected = typeof data?.userId === "string" && allowedUserIds.includes(data.userId) &&
    Number.isFinite(stamp) && stamp <= Date.now() && Date.now() - stamp <= TRACKER_CONNECTION_TTL_MS;
  return { connected, connectedAt: connected ? data!.connectedAt! : null };
}

export async function recordTrackerConnection(scrimId: string, userId: string, discordUserId: string) {
  const data = { userId, discordUserId, connectedAt: new Date().toISOString() };
  const where = { action: TRACKER_CONNECTION_ACTION, targetType: "Scrim", targetId: scrimId };
  const prior = await prisma.adminAuditLog.findFirst({ where, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (prior) {
    await prisma.adminAuditLog.update({ where: { id: prior.id }, data: { afterData: data } });
  } else {
    await prisma.adminAuditLog.create({ data: { ...where, reason: "Windows tracker authenticated presence", afterData: data } });
  }
}
