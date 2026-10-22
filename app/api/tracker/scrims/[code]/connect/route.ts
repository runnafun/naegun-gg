import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTrackerPrincipal } from "@/app/lib/tracker-desktop-auth";
import { recordTrackerConnection } from "@/app/lib/tracker-presence";

export const dynamic = "force-dynamic";

// The desktop connects before team confirmation. No game recording starts here.
export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const principal = await getTrackerPrincipal(request);
  if (!principal) return NextResponse.json({ ok: false, error: "TRACKER_SESSION_INVALID_OR_EXPIRED" }, { status: 401 });
  const code = (await context.params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return NextResponse.json({ ok: false, error: "RANKED_CODE_REQUIRED" }, { status: 400 });
  const scrim = await prisma.scrim.findUnique({
    where: { code }, select: { id: true, type: true, status: true, participants: {
      where: { status: "CONFIRMED" }, select: { userId: true },
    } },
  });
  if (!scrim || scrim.type !== "RANKED") return NextResponse.json({ ok: false, error: "RANKED_SCRIM_NOT_FOUND" }, { status: 404 });
  if (!["TEAM_SELECTION", "IN_PROGRESS"].includes(scrim.status))
    return NextResponse.json({ ok: false, error: "TEAM_ALLOCATION_REQUIRED" }, { status: 409 });
  if (scrim.participants.length !== 10 || !scrim.participants.some(p => p.userId === principal.userId))
    return NextResponse.json({ ok: false, error: "TRACKER_PARTICIPANT_REQUIRED" }, { status: 403 });
  await recordTrackerConnection(scrim.id, principal.userId, principal.discordUserId);
  return NextResponse.json({ ok: true, code, connected: true, status: scrim.status,
    ready: scrim.status === "IN_PROGRESS" }, { headers: { "Cache-Control": "no-store" } });
}
