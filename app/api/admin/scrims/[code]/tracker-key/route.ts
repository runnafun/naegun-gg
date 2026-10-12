import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
import { loadTrackerScrim, trackerDigest } from "@/app/lib/tracker-access";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: {params: Promise<{code: string}>}) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return NextResponse.json({error: "ADMIN_REQUIRED"}, {status: admin.status});
  const code = (await context.params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return NextResponse.json({error: "RANKED_CODE_REQUIRED"}, {status: 400});
  const scrim = await loadTrackerScrim(code);
  if (!scrim) return NextResponse.json({error: "TEAM_NOT_CONFIRMED_OR_ROSTER_INCOMPLETE"}, {status: 409});
  const key = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  await prisma.adminAuditLog.create({data: {
    adminId: admin.user?.id ?? null,
    action: "TRACKER_KEY_ISSUED", targetType: "Scrim", targetId: scrim.id,
    reason: "랭크 내전 트래커 접속키 발급 (기존 키 폐기)",
    afterData: {code, digest: trackerDigest(key), expiresAt},
  }});
  return NextResponse.json({ok: true, code, key, expiresAt}, {headers: {"Cache-Control": "no-store"}});
}
