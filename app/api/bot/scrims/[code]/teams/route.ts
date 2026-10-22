import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";
import { balanceRankTeams } from "@/app/lib/rank-team-balance";
import { buildRankedPayload } from "@/app/lib/ranked-team-data";
import { getTrackerConnection } from "@/app/lib/tracker-presence";

export const dynamic = "force-dynamic";

const LANES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;
type Lane = typeof LANES[number];
type Member = { userId: string; assignedPosition: Lane };
type Context = { params: Promise<{ code: string }> };

async function getRanked(code: string) {
  return prisma.scrim.findUnique({
    where: { code },
    include: {
      participants: {
        where: { status: "CONFIRMED" },
        include: {
          user: {
            include: {
              discordAccount: true,
              riotAccount: true,
            },
          },
        },
      },
    },
  });
}

function fail(error: string, status: number) {
  return NextResponse.json(
    { ok: false, error },
    { status }
  );
}

function validTeams(
  blue: unknown,
  red: unknown
): { blue: Member[]; red: Member[] } | null {
  if (
    !Array.isArray(blue) ||
    !Array.isArray(red) ||
    blue.length !== 5 ||
    red.length !== 5
  ) return null;

  for (const team of [blue, red]) {
    if (team.some(x => !x || typeof x !== "object")) {
      return null;
    }

    const members = team as Member[];

    if (
      new Set(members.map(p => p.userId)).size !== 5 ||
      new Set(members.map(p => p.assignedPosition)).size !== 5
    ) return null;

    if (members.some(
      p =>
        typeof p.userId !== "string" ||
        !LANES.includes(p.assignedPosition)
    )) return null;
  }

  if (
    new Set(
      [...blue, ...red].map(p => p.userId)
    ).size !== 10
  ) return null;

  return {
    blue: blue as Member[],
    red: red as Member[],
  };
}

function mapMembers(
  scrim: NonNullable<Awaited<ReturnType<typeof getRanked>>>,
  team: Member[]
) {
  const users = new Map(
    scrim.participants.map(p => [p.userId, p.user])
  );

  return team.map(member => {
    const user = users.get(member.userId);

    if (!user?.discordAccount || !user.riotAccount) {
      throw new Error("참가자의 계정 연결 정보가 없습니다.");
    }

    return {
      userId: member.userId,
      discordUserId: user.discordAccount.discordUserId,
      name: `${user.riotAccount.gameName}#${user.riotAccount.tagLine}`,
      assignedPosition: member.assignedPosition,
    };
  });
}

// DB에 확정된 팀 명단 다시 조회
export async function GET(
  request: NextRequest,
  context: Context
) {
  if (!isValidBotRequest(request)) {
    return fail("UNAUTHORIZED", 401);
  }

  const code = (await context.params).code.trim().toUpperCase();
  const scrim = await getRanked(code);

  if (!scrim) return fail("NOT_FOUND", 404);
  if (scrim.type !== "RANKED") return fail("RANKED_ONLY", 403);
  if (request.nextUrl.searchParams.get("trackerStatus") === "1") {
    const tracker = await getTrackerConnection(scrim.id, scrim.participants.map(p => p.userId));
    return NextResponse.json({ ok: true, code, ...tracker }, { headers: { "Cache-Control": "no-store" } });
  }
  if (scrim.status !== "IN_PROGRESS") {
    return fail("NOT_CONFIRMED", 409);
  }

  const log = await prisma.adminAuditLog.findFirst({
    where: {
      action: "RANKED_TEAM_CONFIRMED",
      targetType: "Scrim",
      targetId: scrim.id,
    },
    orderBy: { createdAt: "desc" },
  });

  const record = log?.afterData as {
    blue?: Member[];
    red?: Member[];
    blueUserIds?: string[];
    redUserIds?: string[];
  } | null;

  let teams = validTeams(record?.blue, record?.red);

  if (
    !teams &&
    record?.blueUserIds?.length === 5 &&
    record?.redUserIds?.length === 5
  ) {
    teams = validTeams(
      record.blueUserIds.map((userId, i) => ({
        userId,
        assignedPosition: LANES[i],
      })),
      record.redUserIds.map((userId, i) => ({
        userId,
        assignedPosition: LANES[i],
      }))
    );
  }

  if (!teams) return fail("TEAM_RECORD_MISSING", 409);

  return NextResponse.json({
    ok: true,
    code,
    status: scrim.status,
    blue: mapMembers(scrim, teams.blue),
    red: mapMembers(scrim, teams.red),
  });
}

// PREVIEW: 자동 팀 배정
// CONFIRM: RDS 팀 확정
export async function POST(
  request: NextRequest,
  context: Context
) {
  if (!isValidBotRequest(request)) {
    return fail("UNAUTHORIZED", 401);
  }

  const code = (await context.params).code.trim().toUpperCase();

  if (!/^R\d{3,}$/.test(code)) {
    return fail("RANKED_CODE_REQUIRED", 400);
  }

  const scrim = await getRanked(code);

  if (!scrim) return fail("NOT_FOUND", 404);
  if (scrim.type !== "RANKED") return fail("RANKED_ONLY", 403);

  let body: {
    action?: string;
    blue?: unknown;
    red?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  if (body.action === "PREVIEW") {
    if (!["CLOSED", "TEAM_SELECTION"].includes(scrim.status)) {
      return fail("모집 마감 후 팀 배정할 수 있습니다.", 409);
    }

    if (scrim.participants.length !== 10) {
      return fail("확정 참가자 10명이 필요합니다.", 409);
    }

    const payload = await buildRankedPayload(code);

    if ("error" in payload) {
      return fail(payload.error ?? "RANKED_BALANCE_ERROR", payload.status ?? 500);
    }

    const result = balanceRankTeams(payload.players);

    const accounts = new Map(
      scrim.participants.map(p => [
        p.userId,
        p.user.discordAccount?.discordUserId,
      ])
    );

    if ([...accounts.values()].some(v => !v)) {
      return fail("Discord 계정 연결 누락", 409);
    }

    if (scrim.status === "CLOSED") {
      const changed = await prisma.scrim.updateMany({
        where: {
          id: scrim.id,
          status: "CLOSED",
        },
        data: { status: "TEAM_SELECTION" },
      });

      if (changed.count !== 1) {
        return fail("내전 상태가 변경되었습니다.", 409);
      }
    }

    const serialize = (players: typeof result.blue) =>
      players.map(p => ({
        userId: p.userId,
        discordUserId: accounts.get(p.userId),
        name: p.name,
        assignedPosition: p.assignedPosition,
        br: p.br,
      }));

    return NextResponse.json({
      ok: true,
      code,
      blue: serialize(result.blue),
      red: serialize(result.red),
      blueTotal: result.blueTotal,
      redTotal: result.redTotal,
      powerDiffPercent: result.powerDiffPercent,
      evaluatedCombinations: result.evaluatedCombinations,
    });
  }

  if (body.action === "CONFIRM") {
    if (scrim.status !== "TEAM_SELECTION") {
      return fail("ALREADY_CONFIRMED_OR_NOT_READY", 409);
    }
    const presence = await getTrackerConnection(scrim.id, scrim.participants.map(p => p.userId));
    if (!presence.connected) return fail("TRACKER_NOT_CONNECTED", 409);

    const teams = validTeams(body.blue, body.red);

    if (!teams) {
      return fail("INVALID_TEAMS_OR_POSITIONS", 400);
    }

    const incoming = new Set(
      [...teams.blue, ...teams.red].map(p => p.userId)
    );

    const existing = new Set(
      scrim.participants.map(p => p.userId)
    );

    if (
      incoming.size !== 10 ||
      existing.size !== 10 ||
      [...incoming].some(id => !existing.has(id))
    ) {
      return fail("PARTICIPANTS_CHANGED", 409);
    }

    const blue = mapMembers(scrim, teams.blue);
    const red = mapMembers(scrim, teams.red);

    try {
      await prisma.$transaction(async tx => {
        const fresh = await getTrackerConnection(scrim.id, scrim.participants.map(p => p.userId), tx);
        if (!fresh.connected) throw new Error("TRACKER_NOT_CONNECTED");
        const locked = await tx.scrim.updateMany({
          where: {
            id: scrim.id,
            status: "TEAM_SELECTION",
          },
          data: { status: "IN_PROGRESS" },
        });

        if (locked.count !== 1) {
          throw new Error("ALREADY_CONFIRMED");
        }

        await tx.scrimParticipant.updateMany({
          where: {
            scrimId: scrim.id,
            userId: { in: blue.map(p => p.userId) },
          },
          data: { team: "A" },
        });

        await tx.scrimParticipant.updateMany({
          where: {
            scrimId: scrim.id,
            userId: { in: red.map(p => p.userId) },
          },
          data: { team: "B" },
        });

        await tx.adminAuditLog.create({
          data: {
            action: "RANKED_TEAM_CONFIRMED",
            targetType: "Scrim",
            targetId: scrim.id,
            reason: "Discord 봇에서 팀 확정",
            afterData: {
              code,
              blue,
              red,
              source: "discord-bot",
            },
          },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "TRACKER_NOT_CONNECTED") {
        return fail("TRACKER_NOT_CONNECTED", 409);
      }
      if (
        error instanceof Error &&
        error.message === "ALREADY_CONFIRMED"
      ) {
        return fail("ALREADY_CONFIRMED", 409);
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      code,
      status: "IN_PROGRESS",
      blue,
      red,
    });
  }

  return fail("INVALID_ACTION", 400);
}
