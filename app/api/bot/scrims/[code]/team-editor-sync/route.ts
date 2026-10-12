import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!isValidBotRequest(request)) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const code = (await params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
  const scrim = await prisma.scrim.findUnique({
    where: { code },
    include: { participants: {
      where: { status: "CONFIRMED" },
      include: { user: { include: { discordAccount: true, riotAccount: true } } },
    } },
  });
  if (!scrim || scrim.type !== "RANKED") return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (!["TEAM_SELECTION", "IN_PROGRESS"].includes(scrim.status)) return NextResponse.json({ ok: true, ready: false });
  if (scrim.participants.length !== 10 || scrim.participants.filter(p => p.team === "A").length !== 5 || scrim.participants.filter(p => p.team === "B").length !== 5)
    return NextResponse.json({ ok: true, ready: false });
  const log = await prisma.adminAuditLog.findFirst({
    where: { action: "RANKED_TEAM_CONFIRMED", targetType: "Scrim", targetId: scrim.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, afterData: true },
  });
  const data = log?.afterData as { blue?: { userId: string; assignedPosition: string }[]; red?: { userId: string; assignedPosition: string }[] } | null;
  const positions = new Map([...(Array.isArray(data?.blue) ? data.blue : []), ...(Array.isArray(data?.red) ? data.red : [])].map(p => [p.userId, p.assignedPosition]));
  const POSITIONS = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
  const toMembers = (side: "A" | "B") => scrim.participants.filter(p => p.team === side).map(p => ({
    userId: p.userId,
    discordUserId: p.user.discordAccount?.discordUserId ?? "",
    name: p.user.riotAccount ? `${p.user.riotAccount.gameName}#${p.user.riotAccount.tagLine}` : p.user.discordAccount?.globalName ?? p.userId,
    assignedPosition: positions.get(p.userId) ?? p.mainPosition,
  })).sort((a, b) => POSITIONS.indexOf(a.assignedPosition) - POSITIONS.indexOf(b.assignedPosition));
  const blue = toMembers("A"), red = toMembers("B");
  if ([...blue, ...red].some(m => !m.discordUserId || !POSITIONS.includes(m.assignedPosition)))
    return NextResponse.json({ ok: true, ready: false });
  return NextResponse.json({ ok: true, ready: true, revision: log?.id ?? scrim.updatedAt.toISOString(),
    status: scrim.status, blue, red }, { headers: { "Cache-Control": "no-store" } });
}
