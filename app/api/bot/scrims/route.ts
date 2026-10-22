import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_TYPES = [
  "NORMAL",
  "RANKED",
] as const;

const VALID_RULES = [
  "HARD_FEARLESS",
  "SOFT_FEARLESS",
  "NO_BAN",
  "BAN_FEARLESS",
] as const;

type ScrimType =
  (typeof VALID_TYPES)[number];

type ScrimRule =
  (typeof VALID_RULES)[number];

type CreateScrimBody = {
  code?: string;
  type?: ScrimType;
  rule?: ScrimRule;
  startAt?: string;
  maxPlayers?: number;
  bestOf?: number;
  forumThreadId?: string | null;
  starterMessageId?: string | null;
  alarmMessageId?: string | null;
  createdByDiscordUserId?: string | null;
};

function unauthorized() {
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

function normalizeCode(
  value: string,
) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function isScrimType(
  value: unknown,
): value is ScrimType {
  return (
    typeof value === "string" &&
    VALID_TYPES.includes(
      value as ScrimType,
    )
  );
}

function isScrimRule(
  value: unknown,
): value is ScrimRule {
  return (
    typeof value === "string" &&
    VALID_RULES.includes(
      value as ScrimRule,
    )
  );
}

export async function GET(
  request: NextRequest,
) {
  if (!isValidBotRequest(request)) {
    return unauthorized();
  }

  const rawStatus =
    request.nextUrl.searchParams
      .get("status")
      ?.trim()
      .toUpperCase();

  const allowedStatuses = [
    "OPEN",
    "CLOSED",
    "TEAM_SELECTION",
    "IN_PROGRESS",
    "FINISHED",
    "CANCELLED",
  ];

  const status =
    rawStatus &&
    allowedStatuses.includes(rawStatus)
      ? rawStatus
      : null;

  // 트래커/봇 재시작 복구 전용 경량 상태 조회 (민감한 참가자 데이터 제외).
  // DELETED도 포함해 오래된 봇 모집글이 다시 열리지 않도록 합니다.
  if (request.nextUrl.searchParams.get("compact") === "1") {
    const rows = await prisma.scrim.findMany({
      select: { code: true, status: true },
    });
    return NextResponse.json({ ok: true, scrims: rows },
      { headers: { "Cache-Control": "no-store" } });
  }

  const scrims =
    await prisma.scrim.findMany({
      where: {
        ...(status
          ? {
              status:
                status as any,
            }
          : {
              status: {
                not: "DELETED",
              },
            }),
      },

      orderBy: [
        {
          createdAt: "desc",
        },
      ],

      include: {
        participants: {
          where: {
            status: {
              in: [
                "CONFIRMED",
                "WAITING",
              ],
            },
          },

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

  return NextResponse.json({
    ok: true,

    scrims:
      scrims.map(
        (scrim) => {
          const confirmed =
            scrim.participants.filter(
              (participant) =>
                participant.status ===
                "CONFIRMED",
            );

          const waiting =
            scrim.participants.filter(
              (participant) =>
                participant.status ===
                "WAITING",
            );

          return {
            id: scrim.id,
            code: scrim.code,
            type: scrim.type,
            rule: scrim.rule,
            status: scrim.status,
            bestOf: scrim.bestOf,
            startAt:
              scrim.startAt.toISOString(),
            maxPlayers:
              scrim.maxPlayers,
            participantCount:
              confirmed.length,
            waitingCount:
              waiting.length,

            forumThreadId:
              scrim.forumThreadId,
            starterMessageId:
              scrim.starterMessageId,
            alarmMessageId:
              scrim.alarmMessageId,

            participants:
              scrim.participants.map(
                (participant) => ({
                  userId:
                    participant.userId,

                  discordUserId:
                    participant.user
                      .discordAccount
                      ?.discordUserId ??
                    null,

                  gameName:
                    participant.user
                      .riotAccount
                      ?.gameName ??
                    null,

                  tagLine:
                    participant.user
                      .riotAccount
                      ?.tagLine ??
                    null,

                  mainPosition:
                    participant.mainPosition,

                  subPosition:
                    participant.subPosition,

                  team:
                    participant.team,

                  status:
                    participant.status,
                }),
              ),
          };
        },
      ),
  });
}

export async function POST(
  request: NextRequest,
) {
  if (!isValidBotRequest(request)) {
    return unauthorized();
  }

  let body: CreateScrimBody;

  try {
    body =
      await request.json();
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

  const code =
    body.code
      ? normalizeCode(
          body.code,
        )
      : "";

  if (!code) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SCRIM_CODE_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  if (!isScrimType(body.type)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_SCRIM_TYPE",
      },
      {
        status: 400,
      },
    );
  }

  if (!isScrimRule(body.rule)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_SCRIM_RULE",
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
        error:
          "START_AT_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  const startAt =
    new Date(body.startAt);

  if (
    Number.isNaN(
      startAt.getTime(),
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_START_AT",
      },
      {
        status: 400,
      },
    );
  }

  let createdById:
    | string
    | null = null;

  const createdByDiscordUserId =
    body.createdByDiscordUserId
      ?.trim();

  if (createdByDiscordUserId) {
    const discordAccount =
      await prisma.discordAccount
        .findUnique({
          where: {
            discordUserId:
              createdByDiscordUserId,
          },
          select: {
            userId: true,
          },
        });

    createdById =
      discordAccount?.userId ??
      null;
  }

  const scrim =
    await prisma.scrim.upsert({
      where: {
        code,
      },

      create: {
        code,
        type: body.type,
        rule: body.rule,
        status: "OPEN",
        startAt,

        maxPlayers:
          body.maxPlayers ?? 10,

        bestOf:
          body.bestOf ?? 3,

        forumThreadId:
          body.forumThreadId ??
          null,

        starterMessageId:
          body.starterMessageId ??
          null,

        alarmMessageId:
          body.alarmMessageId ??
          null,

        createdById,
      },

      update: {
        type: body.type,
        rule: body.rule,
        startAt,

        maxPlayers:
          body.maxPlayers ?? 10,

        bestOf:
          body.bestOf ?? 3,

        forumThreadId:
          body.forumThreadId ??
          null,

        starterMessageId:
          body.starterMessageId ??
          null,

        alarmMessageId:
          body.alarmMessageId ??
          null,

        ...(createdById
          ? { createdById }
          : {}),
      },
    });

  return NextResponse.json({
    ok: true,

    scrim: {
      id: scrim.id,
      code: scrim.code,
      type: scrim.type,
      rule: scrim.rule,
      status: scrim.status,
      startAt:
        scrim.startAt.toISOString(),
      maxPlayers:
        scrim.maxPlayers,
      bestOf: scrim.bestOf,
      forumThreadId:
        scrim.forumThreadId,
      starterMessageId:
        scrim.starterMessageId,
      alarmMessageId:
        scrim.alarmMessageId,
    },
  });
}