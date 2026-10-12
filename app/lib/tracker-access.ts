import { verifyTrackerRequest } from "@/app/lib/tracker-desktop-auth";
import crypto from "node:crypto";
import { prisma } from "@/app/lib/prisma";

export function trackerDigest(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function trackerAuthorized(request: Request, scrimId: string) {
  return verifyTrackerRequest(request, scrimId);
}

export function normalizeRiotId(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, "");
}

export async function loadTrackerScrim(code: string) {
  const scrim = await prisma.scrim.findUnique({
    where: { code },
    include: { participants: { where: { status: "CONFIRMED" }, include: {
      user: { include: { riotAccount: true, discordAccount: true } },
    } } },
  });
  if (!scrim || scrim.type !== "RANKED" || scrim.status !== "IN_PROGRESS") return null;
  if (scrim.participants.length !== 10 || scrim.participants.some(p => !p.team || !p.user.riotAccount)) return null;
  const blue = scrim.participants.filter(p => p.team === "A");
  const red = scrim.participants.filter(p => p.team === "B");
  if (blue.length !== 5 || red.length !== 5) return null;
  return scrim;
}

export async function getTrackerRoster(scrim: NonNullable<Awaited<ReturnType<typeof loadTrackerScrim>>>) {
  const confirm = await prisma.adminAuditLog.findFirst({
    where: { action: "RANKED_TEAM_CONFIRMED", targetType: "Scrim", targetId: scrim.id },
    orderBy: { createdAt: "desc" }, select: { afterData: true },
  });
  type Entry = { userId: string; assignedPosition: string };
  const log = confirm?.afterData as { blue?: Entry[]; red?: Entry[] } | null;
  const pos = new Map<string,string>();
  for (const p of [...(log?.blue ?? []), ...(log?.red ?? [])]) {
    if (p.userId && p.assignedPosition) pos.set(p.userId,p.assignedPosition);
  }
  return scrim.participants.map(p => ({
    riotId: `${p.user.riotAccount!.gameName}#${p.user.riotAccount!.tagLine}`,
    team: p.team!,
    position: pos.get(p.userId) ?? p.mainPosition,
  })).sort((a,b) => a.team.localeCompare(b.team) ||
    ["TOP","JUNGLE","MID","ADC","SUPPORT"].indexOf(a.position) -
    ["TOP","JUNGLE","MID","ADC","SUPPORT"].indexOf(b.position));
}
