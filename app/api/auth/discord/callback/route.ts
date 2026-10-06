import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "../../../../lib/prisma";

import {
  exchangeDiscordCode,
  getDiscordUser,
} from "../../../../lib/discord";

import {
  createSessionToken,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../../../../lib/auth";

function getAppUrl(request: NextRequest) {
  return (
    process.env.APP_URL ??
    request.nextUrl.origin
  );
}

export async function GET(
  request: NextRequest,
) {
  const appUrl =
    getAppUrl(request);

  try {
    const code =
      request.nextUrl.searchParams.get(
        "code",
      );

    const state =
      request.nextUrl.searchParams.get(
        "state",
      );

    const savedState =
      request.cookies.get(
        OAUTH_STATE_COOKIE_NAME,
      )?.value;

    if (
      !code ||
      !state ||
      !savedState ||
      state !== savedState
    ) {
      return NextResponse.redirect(
        new URL(
          "/?login=invalid_state",
          appUrl,
        ),
      );
    }

    const token =
      await exchangeDiscordCode(
        code,
      );

    const discordUser =
      await getDiscordUser(
        token.access_token,
      );

    let account =
      await prisma.discordAccount.findUnique(
        {
          where: {
            discordUserId:
              discordUser.id,
          },

          include: {
            user: {
              include: {
                wallet: true,
              },
            },
          },
        },
      );

    if (!account) {
      const createdUser =
        await prisma.user.create({
          data: {
            discordAccount: {
              create: {
                discordUserId:
                  discordUser.id,

                username:
                  discordUser.username,

                globalName:
                  discordUser.global_name,

                avatarHash:
                  discordUser.avatar,
              },
            },

            wallet: {
              create: {},
            },
          },

          include: {
            discordAccount:
              true,

            wallet: true,
          },
        });

      account =
        await prisma.discordAccount.findUnique(
          {
            where: {
              discordUserId:
                discordUser.id,
            },

            include: {
              user: {
                include: {
                  wallet:
                    true,
                },
              },
            },
          },
        );

      if (!account) {
        throw new Error(
          `DiscordAccount 생성 실패: ${createdUser.id}`,
        );
      }
    } else {
      await prisma.discordAccount.update(
        {
          where: {
            id: account.id,
          },

          data: {
            username:
              discordUser.username,

            globalName:
              discordUser.global_name,

            avatarHash:
              discordUser.avatar,
          },
        },
      );

      if (
        !account.user.wallet
      ) {
        await prisma.wallet.create({
          data: {
            userId:
              account.userId,
          },
        });
      }

      account =
        await prisma.discordAccount.findUnique(
          {
            where: {
              discordUserId:
                discordUser.id,
            },

            include: {
              user: {
                include: {
                  wallet:
                    true,
                },
              },
            },
          },
        );

      if (!account) {
        throw new Error(
          "DiscordAccount 재조회 실패",
        );
      }
    }

    const sessionToken =
      await createSessionToken({
        userId:
          account.user.id,

        role:
          account.user.role,
      });

    const response =
      NextResponse.redirect(
        new URL(
          "/",
          appUrl,
        ),
      );

    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionToken,
      sessionCookieOptions,
    );

    response.cookies.set(
      OAUTH_STATE_COOKIE_NAME,
      "",
      {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure:
          process.env
            .AUTH_COOKIE_SECURE ===
          "true",
      },
    );

    return response;
  } catch (error) {
    console.error(
      "Discord OAuth callback error:",
      error,
    );

    return NextResponse.redirect(
      new URL(
        "/?login=error",
        appUrl,
      ),
    );
  }
}