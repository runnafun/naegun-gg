import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";

const VALID_POSITIONS = [
  "TOP",
  "JUNGLE",
  "MID",
  "ADC",
  "SUPPORT",
  "ANY",
] as const;

type PositionValue = (typeof VALID_POSITIONS)[number];

type RegisterBody = {
  discordUserId?: string;
  username?: string;
  globalName?: string | null;
  avatarHash?: string | null;

  puuid?: string;
  gameName?: string;
  tagLine?: string;

  soloTier?: string | null;
  soloRank?: string | null;
  soloLp?: number | null;

  mainPosition?: PositionValue;
  subPosition?: PositionValue;
};

function isValidPosition(value: unknown): value is PositionValue {
  return (
    typeof value === "string" &&
    VALID_POSITIONS.includes(value as PositionValue)
  );
}

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

  let body: RegisterBody;

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

  const discordUserId = body.discordUserId?.trim();
  const username = body.username?.trim();

  const puuid = body.puuid?.trim();
  const gameName = body.gameName?.trim();
  const tagLine = body.tagLine?.trim().replace(/^#/, "");

  const mainPosition = body.mainPosition;
  const subPosition = body.subPosition;

  if (!discordUserId || !username) {
    return NextResponse.json(
      {
        ok: false,
        error: "DISCORD_INFO_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  if (!puuid || !gameName || !tagLine) {
    return NextResponse.json(
      {
        ok: false,
        error: "RIOT_INFO_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isValidPosition(mainPosition) ||
    !isValidPosition(subPosition)
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

  if (
    mainPosition === subPosition &&
    mainPosition !== "ANY"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "DUPLICATE_POSITION",
      },
      {
        status: 400,
      },
    );
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      /*
       * 1. Discord ID로 기존 사용자 확인
       */
      let discordAccount =
        await tx.discordAccount.findUnique({
          where: {
            discordUserId,
          },
          include: {
            user: {
              include: {
                riotAccount: true,
                preferences: true,
              },
            },
          },
        });

      /*
       * 2. 아예 처음 온 사용자면 User 생성
       */
      if (!discordAccount) {
        const user = await tx.user.create({
          data: {
            discordAccount: {
              create: {
                discordUserId,
                username,
                globalName: body.globalName ?? null,
                avatarHash: body.avatarHash ?? null,
              },
            },

            wallet: {
              create: {},
            },

            stats: {
              create: {},
            },

            defenseStats: {
              create: {},
            },
          },
          include: {
            discordAccount: true,
            riotAccount: true,
            preferences: true,
          },
        });

        discordAccount = {
          ...user.discordAccount!,
          user,
        };
      } else {
        /*
         * Discord 닉네임/프로필 정보 최신화
         */
        await tx.discordAccount.update({
          where: {
            id: discordAccount.id,
          },
          data: {
            username,
            globalName: body.globalName ?? null,
            avatarHash: body.avatarHash ?? null,
          },
        });
      }

      const userId = discordAccount.userId;

      /*
       * 3. 해당 PUUID가 다른 사용자에게 이미 연결됐는지 검사
       */
      const duplicatePuuid =
        await tx.riotAccount.findUnique({
          where: {
            puuid,
          },
        });

      if (
        duplicatePuuid &&
        duplicatePuuid.userId !== userId
      ) {
        throw new Error("RIOT_ACCOUNT_ALREADY_LINKED");
      }

      /*
       * 4. 현재 Riot 계정 확인
       */
      const currentRiot =
        await tx.riotAccount.findUnique({
          where: {
            userId,
          },
        });

      let riotAccount;

      /*
       * 최초 Riot 연동
       */
      if (!currentRiot) {
        riotAccount = await tx.riotAccount.create({
          data: {
            userId,
            puuid,
            gameName,
            tagLine,

            soloTier: body.soloTier ?? null,
            soloRank: body.soloRank ?? null,
            soloLp: body.soloLp ?? null,

            lastSyncedAt: now,
          },
        });
      }

      /*
       * 같은 PUUID
       *
       * Riot 닉네임/태그 변경은 자유롭게 동기화.
       * lastChangedAt은 건드리지 않는다.
       */
      else if (currentRiot.puuid === puuid) {
        riotAccount = await tx.riotAccount.update({
          where: {
            id: currentRiot.id,
          },
          data: {
            gameName,
            tagLine,

            soloTier: body.soloTier ?? null,
            soloRank: body.soloRank ?? null,
            soloLp: body.soloLp ?? null,

            lastSyncedAt: now,
          },
        });
      }

      /*
       * 다른 PUUID로 변경
       */
      else {
        const changeBase =
          currentRiot.lastChangedAt ??
          currentRiot.linkedAt;

        const nextChangeAt = new Date(
          changeBase.getTime() +
            30 * 24 * 60 * 60 * 1000,
        );

        if (now < nextChangeAt) {
          const error = new Error(
            "RIOT_CHANGE_COOLDOWN",
          );

          (
            error as Error & {
              nextChangeAt?: Date;
            }
          ).nextChangeAt = nextChangeAt;

          throw error;
        }

        /*
         * 변경 이력 저장
         */
        await tx.riotAccountHistory.create({
          data: {
            riotAccountId: currentRiot.id,

            oldPuuid: currentRiot.puuid,
            oldGameName: currentRiot.gameName,
            oldTagLine: currentRiot.tagLine,

            newPuuid: puuid,
            newGameName: gameName,
            newTagLine: tagLine,

            changedAt: now,
          },
        });

        riotAccount = await tx.riotAccount.update({
          where: {
            id: currentRiot.id,
          },
          data: {
            puuid,
            gameName,
            tagLine,

            soloTier: body.soloTier ?? null,
            soloRank: body.soloRank ?? null,
            soloLp: body.soloLp ?? null,

            lastChangedAt: now,
            lastSyncedAt: now,
          },
        });
      }

      /*
       * 5. 주/부 포지션 저장
       */
      const preferences =
        await tx.userPreference.upsert({
          where: {
            userId,
          },

          create: {
            userId,
            mainPosition,
            subPosition,
          },

          update: {
            mainPosition,
            subPosition,
          },
        });

      return {
        userId,

        riotAccount,

        preferences,
      };
    });

    return NextResponse.json({
      ok: true,
      registered: true,

      user: {
        id: result.userId,

        riot: {
          puuid: result.riotAccount.puuid,
          gameName:
            result.riotAccount.gameName,
          tagLine:
            result.riotAccount.tagLine,

          soloTier:
            result.riotAccount.soloTier,
          soloRank:
            result.riotAccount.soloRank,
          soloLp:
            result.riotAccount.soloLp,
        },

        preferences: {
          mainPosition:
            result.preferences.mainPosition,
          subPosition:
            result.preferences.subPosition,
        },
      },
    });
  } catch (error) {
    console.error(
      "봇 사용자 등록 오류:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "RIOT_ACCOUNT_ALREADY_LINKED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "RIOT_ACCOUNT_ALREADY_LINKED",
          message:
            "이미 다른 Discord 계정에 연결된 Riot 계정입니다.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "RIOT_CHANGE_COOLDOWN"
    ) {
      const customError =
        error as Error & {
          nextChangeAt?: Date;
        };

      return NextResponse.json(
        {
          ok: false,
          error: "RIOT_CHANGE_COOLDOWN",
          message:
            "Riot 계정은 30일에 한 번만 변경할 수 있습니다.",
          nextChangeAt:
            customError.nextChangeAt?.toISOString() ??
            null,
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}