import {
  NextResponse,
} from "next/server";

import {
  getSession,
} from "../../../lib/auth";

import {
  prisma,
} from "../../../lib/prisma";

import {
  getDiscordAvatarUrl,
} from "../../../lib/discord";

export async function GET() {
  const session =
    await getSession();

  if (!session) {
    return NextResponse.json(
      {
        authenticated:
          false,
      },
      {
        status: 401,
      },
    );
  }

  const user =
    await prisma.user.findUnique(
      {
        where: {
          id: session.userId,
        },

        include: {
          discordAccount:
            true,

          wallet: true,

          riotAccount: true,
        },
      },
    );

  if (
    !user ||
    !user.discordAccount
  ) {
    return NextResponse.json(
      {
        authenticated:
          false,
      },
      {
        status: 401,
      },
    );
  }

  const discord =
    user.discordAccount;

  return NextResponse.json({
    authenticated: true,

    user: {
      id: user.id,

      role: user.role,

      status: user.status,

      username:
        discord.username,

      displayName:
        discord.globalName ??
        discord.username,

      discordUserId:
        discord.discordUserId,

      avatarUrl:
        getDiscordAvatarUrl(
          discord,
        ),

      ggCoin:
        (
          user.wallet?.balance ??
          BigInt(0)
        ).toString(),

      riotLinked:
        Boolean(
          user.riotAccount,
        ),

      riotAccount:
        user.riotAccount
          ? {
              gameName:
                user.riotAccount
                  .gameName,

              tagLine:
                user.riotAccount
                  .tagLine,
            }
          : null,
    },
  });
}