import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getTrackerConnection } from "@/app/lib/tracker-presence";

export const dynamic =
  "force-dynamic";

type Body = {
  blueUserIds?: string[];
  redUserIds?: string[];
};

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      code: string;
    }>;
  },
) {
  const admin =
    await requireAdmin(request);

  if (!admin.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          admin.status === 401
            ? "UNAUTHORIZED"
            : "FORBIDDEN",
      },
      {
        status: admin.status,
      },
    );
  }

  const { code: rawCode } =
    await context.params;

  const code =
    rawCode.trim().toUpperCase();

  let body: Body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      {
        status: 400,
      },
    );
  }

  const blue =
    body.blueUserIds ?? [];

  const red =
    body.redUserIds ?? [];

  if (
    blue.length !== 5 ||
    red.length !== 5
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "EACH_TEAM_MUST_HAVE_5",
      },
      {
        status: 400,
      },
    );
  }

  const all =
    [...blue, ...red];

  if (
    new Set(all).size !== 10
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "DUPLICATE_TEAM_MEMBER",
      },
      {
        status: 400,
      },
    );
  }

  const scrim =
    await prisma.scrim.findUnique({
      where: {
        code,
      },

      include: {
        participants: {
          where: {
            status: "CONFIRMED",
          },
        },
      },
    });

  if (!scrim) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SCRIM_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  if (scrim.type !== "RANKED") {
    return NextResponse.json(
      { ok: false, error: "RANKED_ONLY" },
      { status: 403 },
    );
  }

  if (scrim.status !== "TEAM_SELECTION") {
    return NextResponse.json(
      {
        ok: false,
        error: "TEAM_SELECTION_REQUIRED",
      },
      { status: 409 },
    );
  }

  const actual =
    new Set(
      scrim.participants.map(
        (p) => p.userId,
      ),
    );

  if (
    actual.size !== 10 ||
    all.some(
      (userId) =>
        !actual.has(userId),
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "TEAM_MEMBERS_DO_NOT_MATCH_CONFIRMED_PARTICIPANTS",
      },
      {
        status: 409,
      },
    );
  }

  const presence = await getTrackerConnection(scrim.id, [...actual]);
  if (!presence.connected) return NextResponse.json({ok:false,error:"TRACKER_NOT_CONNECTED",message:"트래커 연결 후 확정해주세요."},{status:409});
  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await getTrackerConnection(scrim.id, [...actual], tx);
      if (!fresh.connected) throw new Error("TRACKER_NOT_CONNECTED");
      // 중복 확정 방지
    const lock = await tx.scrim.updateMany({
      where: {
        id: scrim.id,
        status: "TEAM_SELECTION",
      },
      data: {
        status: "IN_PROGRESS",
      },
    });

    if (lock.count !== 1) {
      throw new Error("TEAM_ALREADY_CONFIRMED");
    }

    await tx.scrimParticipant.updateMany({
      where: {
        scrimId: scrim.id,
        userId: { in: blue },
      },
      data: { team: "A" },
    });

    await tx.scrimParticipant.updateMany({
      where: {
        scrimId: scrim.id,
        userId: { in: red },
      },
      data: { team: "B" },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId: admin.user?.id ?? null,
        action: "RANKED_TEAM_CONFIRMED",
        targetType: "Scrim",
        targetId: scrim.id,
        afterData: {
          code,
          blueUserIds: blue,
          redUserIds: red,
        },
      },
    });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TRACKER_NOT_CONNECTED")
      return NextResponse.json({ok:false,error:"TRACKER_NOT_CONNECTED",message:"트래커 연결 후 확정해주세요."},{status:409});
    if (error instanceof Error && error.message === "TEAM_ALREADY_CONFIRMED")
      return NextResponse.json({ok:false,error:"TEAM_ALREADY_CONFIRMED"},{status:409});
    throw error;
  }

  return NextResponse.json({
    ok: true,
    code,
    blueUserIds: blue,
    redUserIds: red,
  });
}
