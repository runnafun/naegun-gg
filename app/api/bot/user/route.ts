import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";

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

  const discordUserId = request.nextUrl.searchParams
    .get("discordUserId")
    ?.trim();

  if (!discordUserId) {
    return NextResponse.json(
      {
        ok: false,
        error: "DISCORD_USER_ID_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  const discordAccount = await prisma.discordAccount.findUnique({
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

  if (!discordAccount) {
    return NextResponse.json({
      ok: true,
      registered: false,
      user: null,
    });
  }

  const { user } = discordAccount;

  return NextResponse.json({
    ok: true,
    registered: true,
    user: {
      id: user.id,
      role: user.role,
      status: user.status,

      discord: {
        discordUserId: discordAccount.discordUserId,
        username: discordAccount.username,
        globalName: discordAccount.globalName,
        avatarHash: discordAccount.avatarHash,
      },

      riot: user.riotAccount
        ? {
            puuid: user.riotAccount.puuid,
            gameName: user.riotAccount.gameName,
            tagLine: user.riotAccount.tagLine,
            region: user.riotAccount.region,
            profileIconId: user.riotAccount.profileIconId,
            soloTier: user.riotAccount.soloTier,
            soloRank: user.riotAccount.soloRank,
            soloLp: user.riotAccount.soloLp,
            lastChangedAt: user.riotAccount.lastChangedAt,
            lastSyncedAt: user.riotAccount.lastSyncedAt,
          }
        : null,

      preferences: user.preferences
        ? {
            mainPosition: user.preferences.mainPosition,
            subPosition: user.preferences.subPosition,
          }
        : null,
    },
  });
}