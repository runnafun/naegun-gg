import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";

const POSITIONS = [
  "TOP",
  "JUNGLE",
  "MID",
  "ADC",
  "SUPPORT",
  "ANY",
] as const;

type PositionValue =
  (typeof POSITIONS)[number];

type ParticipantBody = {
  discordUserId?: string;

  mainPosition?: PositionValue;
  subPosition?: PositionValue;

  status?: "CONFIRMED" | "WAITING";
};

function isPosition(
  value: unknown,
): value is PositionValue {
  return (
    typeof value === "string" &&
    POSITIONS.includes(
      value as PositionValue,
    )
  );
}

export async function POST(
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

  let body: ParticipantBody;

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

  const discordUserId =
    body.discordUserId?.trim();

  if (!discordUserId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "DISCORD_USER_ID_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isPosition(body.mainPosition) ||
    !isPosition(body.subPosition)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_POSITION",
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
    });

  if (!scrim) {
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

  if (scrim.status !== "OPEN") {
    return NextResponse.json(
      {
        ok: false,
        error: "SCRIM_NOT_OPEN",
      },
      {
        status: 409,
      },
    );
  }

  const discordAccount =
    await prisma.discordAccount.findUnique({
      where: {
        discordUserId,
      },
      include: {
        user: {
          include: {
            riotAccount: true,
          },
        },
      },
    });

  if (!discordAccount) {
    return NextResponse.json(
      {
        ok: false,
        error: "USER_NOT_REGISTERED",
      },
      {
        status: 404,
      },
    );
  }

  if (!discordAccount.user.riotAccount) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "RIOT_ACCOUNT_NOT_LINKED",
      },
      {
        status: 409,
      },
    );
  }

  const participant =
    await prisma.scrimParticipant.upsert({
      where: {
        scrimId_userId: {
          scrimId: scrim.id,
          userId: discordAccount.userId,
        },
      },

      create: {
        scrimId: scrim.id,
        userId: discordAccount.userId,

        mainPosition:
          body.mainPosition,

        subPosition:
          body.subPosition,

        status:
          body.status ?? "CONFIRMED",
      },

      update: {
        mainPosition:
          body.mainPosition,

        subPosition:
          body.subPosition,

        status:
          body.status ?? "CONFIRMED",
      },
    });

  return NextResponse.json({
    ok: true,
    participant: {
      id: participant.id,

      status: participant.status,

      mainPosition:
        participant.mainPosition,

      subPosition:
        participant.subPosition,

      team: participant.team,
    },
  });
}