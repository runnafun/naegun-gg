import { NextResponse } from "next/server";

import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getDiscordAvatarUrl } from "../../../lib/discord";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      },
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      discordAccount: true,
      adminCredential: true,
      wallet: true,
      riotAccount: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      },
    );
  }

  const discord = user.discordAccount;
  const admin = user.adminCredential;

  if (!discord && !admin) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      },
    );
  }

  if (admin) {
    return NextResponse.json({
      authenticated: true,

      user: {
        id: user.id,
        role: user.role,
        status: user.status,

        username: admin.username,
        displayName: admin.username,

        discordUserId: null,
        avatarUrl: null,

        ggCoin: (
          user.wallet?.balance ??
          BigInt(0)
        ).toString(),

        riotLinked: Boolean(
          user.riotAccount,
        ),

        riotAccount: user.riotAccount
          ? {
              gameName:
                user.riotAccount.gameName,

              tagLine:
                user.riotAccount.tagLine,
            }
          : null,

        isAdminAccount: true,
      },
    });
  }

  if (!discord) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json({
    authenticated: true,

    user: {
      id: user.id,
      role: user.role,
      status: user.status,

      username: discord.username,

      displayName:
        discord.globalName ??
        discord.username,

      discordUserId:
        discord.discordUserId,

      avatarUrl:
        getDiscordAvatarUrl(
          discord,
        ),

      ggCoin: (
        user.wallet?.balance ??
        BigInt(0)
      ).toString(),

      riotLinked: Boolean(
        user.riotAccount,
      ),

      riotAccount: user.riotAccount
        ? {
            gameName:
              user.riotAccount.gameName,

            tagLine:
              user.riotAccount.tagLine,
          }
        : null,

      isAdminAccount: false,
    },
  });
}
