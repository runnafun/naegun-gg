import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";

const RULES = [
  "HARD_FEARLESS",
  "SOFT_FEARLESS",
  "NO_BAN",
  "BAN_FEARLESS",
] as const;

const TYPES = ["NORMAL", "RANKED"] as const;

type ScrimRuleValue = (typeof RULES)[number];
type ScrimTypeValue = (typeof TYPES)[number];

type CreateScrimBody = {
  code?: string;

  type?: ScrimTypeValue;
  rule?: ScrimRuleValue;

  startAt?: string;

  maxPlayers?: number;
  bestOf?: number;

  forumThreadId?: string | null;
  starterMessageId?: string | null;
  alarmMessageId?: string | null;

  createdByDiscordUserId?: string | null;
};

function isRule(value: unknown): value is ScrimRuleValue {
  return (
    typeof value === "string" &&
    RULES.includes(value as ScrimRuleValue)
  );
}

function isType(value: unknown): value is ScrimTypeValue {
  return (
    typeof value === "string" &&
    TYPES.includes(value as ScrimTypeValue)
  );
}

/*
 * 내전 목록
 */
export async function GET(request: NextRequest) {
  if (!isValidBotRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  const status =
    request.nextUrl.searchParams.get("status");

  const scrims = await prisma.scrim.findMany({
    where: status
      ? {
          status: status as
            | "OPEN"
            | "CLOSED"
            | "TEAM_SELECTION"
            | "IN_PROGRESS"
            | "FINISHED"
            | "CANCELLED"
            | "DELETED",
        }
      : undefined,

    include: {
      participants: {
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

    orderBy: {
      startAt: "asc",
    },
  });

  return NextResponse.json({
    ok: true,
    scrims: scrims.map((scrim) => ({
      id: scrim.id,
      code: scrim.code,

      type: scrim.type,
      rule: scrim.rule,
      status: scrim.status,

      bestOf: scrim.bestOf,
      startAt: scrim.startAt,
      maxPlayers: scrim.maxPlayers,

      forumThreadId: scrim.forumThreadId,
      starterMessageId: scrim.starterMessageId,
      alarmMessageId: scrim.alarmMessageId,

      participantCount:
        scrim.participants.filter(
          (participant) =>
            participant.status === "CONFIRMED",
        ).length,

      waitingCount:
        scrim.participants.filter(
          (participant) =>
            participant.status === "WAITING",
        ).length,

      participants:
        scrim.participants.map((participant) => ({
          id: participant.id,
          status: participant.status,

          mainPosition:
            participant.mainPosition,

          subPosition:
            participant.subPosition,

          team: participant.team,

          discordUserId:
            participant.user.discordAccount
              ?.discordUserId ?? null,

          gameName:
            participant.user.riotAccount
              ?.gameName ?? null,

          tagLine:
            participant.user.riotAccount
              ?.tagLine ?? null,
        })),
    })),
  });
}

/*
 * 내전 생성 / 갱신
 */
export async function POST(request: NextRequest) {
  if (!isValidBotRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  let body: CreateScrimBody;

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

  const code = body.code?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      {
        ok: false,
        error: "CODE_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  if (!isType(body.type)) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_SCRIM_TYPE",
      },
      {
        status: 400,
      },
    );
  }

  if (!isRule(body.rule)) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_SCRIM_RULE",
      },
      {
        status: 400,
      },
    );
  }

  if (!body.startAt) {
    return NextResponse.json(
      {
        ok: false,
        error: "START_AT_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  const startAt = new Date(body.startAt);

  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_START_AT",
      },
      {
        status: 400,
      },
    );
  }

  let createdById: string | null = null;

  if (body.createdByDiscordUserId) {
    const creator =
      await prisma.discordAccount.findUnique({
        where: {
          discordUserId:
            body.createdByDiscordUserId,
        },
      });

    createdById = creator?.userId ?? null;
  }

  const scrim = await prisma.scrim.upsert({
    where: {
      code,
    },

    create: {
      code,

      type: body.type,
      rule: body.rule,

      status: "OPEN",

      bestOf: body.bestOf ?? 3,
      maxPlayers: body.maxPlayers ?? 10,

      startAt,

      forumThreadId:
        body.forumThreadId ?? null,

      starterMessageId:
        body.starterMessageId ?? null,

      alarmMessageId:
        body.alarmMessageId ?? null,

      createdById,
    },

    update: {
      type: body.type,
      rule: body.rule,

      startAt,

      bestOf: body.bestOf ?? 3,
      maxPlayers: body.maxPlayers ?? 10,

      forumThreadId:
        body.forumThreadId ?? undefined,

      starterMessageId:
        body.starterMessageId ?? undefined,

      alarmMessageId:
        body.alarmMessageId ?? undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    scrim,
  });
}