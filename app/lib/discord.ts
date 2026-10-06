export type DiscordUser = {
  id: string;
  username: string;

  global_name:
    | string
    | null;

  avatar:
    | string
    | null;
};

function requireEnv(
  key: string,
) {
  const value =
    process.env[key];

  if (!value) {
    throw new Error(
      `${key}이 설정되지 않았습니다.`,
    );
  }

  return value;
}

export function getDiscordConfig() {
  return {
    clientId:
      requireEnv(
        "DISCORD_CLIENT_ID",
      ),

    clientSecret:
      requireEnv(
        "DISCORD_CLIENT_SECRET",
      ),

    redirectUri:
      requireEnv(
        "DISCORD_REDIRECT_URI",
      ),
  };
}

export async function exchangeDiscordCode(
  code: string,
) {
  const {
    clientId,
    clientSecret,
    redirectUri,
  } = getDiscordConfig();

  const body =
    new URLSearchParams({
      client_id: clientId,
      client_secret:
        clientSecret,

      grant_type:
        "authorization_code",

      code,

      redirect_uri:
        redirectUri,
    });

  const response =
    await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body,

        cache: "no-store",
      },
    );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      `Discord token exchange 실패: ${response.status} ${text}`,
    );
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }>;
}

export async function getDiscordUser(
  accessToken: string,
) {
  const response =
    await fetch(
      "https://discord.com/api/v10/users/@me",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      `Discord 사용자 정보 조회 실패: ${response.status}`,
    );
  }

  return response.json() as Promise<DiscordUser>;
}

export function getDiscordAvatarUrl(
  user: {
    discordUserId: string;
    avatarHash: string | null;
  },
) {
  if (!user.avatarHash) {
    return null;
  }

  const extension =
    user.avatarHash.startsWith(
      "a_",
    )
      ? "gif"
      : "png";

  return (
    `https://cdn.discordapp.com/avatars/` +
    `${user.discordUserId}/` +
    `${user.avatarHash}.${extension}` +
    `?size=128`
  );
}