import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";

const SCRIM_STATUSES = [
  "OPEN",
  "CLOSED",
  "TEAM_SELECTION",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED",
  "DELETED",
] as const;

type ScrimStatusValue =
  (typeof SCRIM_STATUSES)[number];

type UpdateScrimBody = {
  status?: ScrimStatusValue;
  closedByDiscordUserId?: string | null;
};

function isScrimStatus(
  value: unknown,
): value is ScrimStatusValue {
  return (
    typeof value === "string" &&
    SCRIM_STATUSES.includes(
      value as ScrimStatusValue,
    )
  );
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      code: string;
    }>;
  },
) {
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

  const { code: rawCode } =
    await context.params;

  const code =
    rawCode.trim().toUpperCase();

  let body: UpdateScrimBody;

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

  if (
    body.status !== undefined &&
    !isScrimStatus(body.status)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_SCRIM_STATUS",
      },
      {
        status: 400,
      },
    );
  }

  const current =
    await prisma.scrim.findUnique({
      where: {
        code,
      },
    });

  if (!current) {
    return NextResponse.json(
      {
        ok: false,
        error: "SCRIM_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  let closedById: string | null | undefined =
    undefined;

  if (
    body.closedByDiscordUserId !==
      undefined
  ) {
    if (body.closedByDiscordUserId) {
      const discordAccount =
        await prisma.discordAccount.findUnique({
          where: {
            discordUserId:
              body.closedByDiscordUserId,
          },
        });

      closedById =
        discordAccount?.userId ?? null;
    } else {
      closedById = null;
    }
  }

  const nextStatus =
    body.status ?? current.status;

  const scrim =
    await prisma.scrim.update({
      where: {
        code,
      },

      data: {
        ...(body.status !== undefined
          ? {
              status: nextStatus,
            }
          : {}),

        ...(closedById !== undefined
          ? {
              closedById,
            }
          : {}),

        ...(nextStatus === "CLOSED"
          ? {
              closedAt:
                current.closedAt ??
                new Date(),
            }
          : {}),

        ...(nextStatus === "FINISHED"
          ? {
              finishedAt:
                current.finishedAt ??
                new Date(),
            }
          : {}),
      },
    });

  return NextResponse.json({
    ok: true,
    scrim: {
      id: scrim.id,
      code: scrim.code,
      type: scrim.type,
      status: scrim.status,
      closedAt: scrim.closedAt,
      finishedAt: scrim.finishedAt,
    },
  });
}
