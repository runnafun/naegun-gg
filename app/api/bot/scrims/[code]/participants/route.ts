import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";
import { syncRiotAccountByUserId } from "@/app/lib/riot-sync";

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

const PARTICIPANT_STATUSES = [
  "CONFIRMED",
  "WAITING",
  "CANCELLED",
  "REMOVED",
] as const;

type PositionValue =
  (typeof POSITIONS)[number];

type ParticipantStatusValue =
  (typeof PARTICIPANT_STATUSES)[number];

type ParticipantBody = {
  discordUserId?: string;

  mainPosition?: PositionValue;
  subPosition?: PositionValue;

  status?: ParticipantStatusValue;
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

function isParticipantStatus(
  value: unknown,
): value is ParticipantStatusValue {
  return (
    typeof value === "string" &&
    PARTICIPANT_STATUSES.includes(
      value as ParticipantStatusValue,
    )
  );
}

async function getContext(
  code: string,
  discordUserId: string,
) {
  const scrim =
    await prisma.scrim.findUnique({
      where: {
        code,
      },
    });

  if (!scrim) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "SCRIM_NOT_FOUND",
        },
        {
          status: 404,
        },
      ),
    };
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
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "USER_NOT_REGISTERED",
        },
        {
          status: 404,
        },
      ),
    };
  }

  return {
    scrim,
    discordAccount,
  };
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

  const status =
    body.status ?? "CONFIRMED";

  if (
    status !== "CONFIRMED" &&
    status !== "WAITING"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_JOIN_STATUS",
      },
      {
        status: 400,
      },
    );
  }

  const result =
    await getContext(
      code,
      discordUserId,
    );

  if ("error" in result) {
    return result.error;
  }

  const {
    scrim,
    discordAccount,
  } = result;

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

  if (
    !discordAccount.user.riotAccount
  ) {
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
          userId:
            discordAccount.userId,
        },
      },

      create: {
        scrimId: scrim.id,
        userId:
          discordAccount.userId,

        mainPosition:
          body.mainPosition,

        subPosition:
          body.subPosition,

        status,
      },

      update: {
        mainPosition:
          body.mainPosition,

        subPosition:
          body.subPosition,

        status,
      },
    });

  /*
    참가 신청 응답을 Riot API 때문에 지연시키지 않는다.
    참가자는 즉시 등록하고,
    Riot 티어/승률/최근 경기 정보는 백그라운드에서 갱신한다.
  */
  void syncRiotAccountByUserId(
    discordAccount.userId,
  )
    .then((syncResult) => {
      console.log(
        `[SCRIM ${scrim.code}] Riot 자동 갱신 완료`,
        syncResult,
      );
    })
    .catch((error) => {
      console.error(
        `[SCRIM ${scrim.code}] Riot 자동 갱신 실패`,
        error,
      );
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
    !isParticipantStatus(
      body.status,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_PARTICIPANT_STATUS",
      },
      {
        status: 400,
      },
    );
  }

  const result =
    await getContext(
      code,
      discordUserId,
    );

  if ("error" in result) {
    return result.error;
  }

  const {
    scrim,
    discordAccount,
  } = result;

  const existing =
    await prisma.scrimParticipant.findUnique({
      where: {
        scrimId_userId: {
          scrimId: scrim.id,
          userId:
            discordAccount.userId,
        },
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "PARTICIPANT_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  const participant =
    await prisma.scrimParticipant.update({
      where: {
        id: existing.id,
      },

      data: {
        status: body.status,
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
