import {
  randomBytes,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  getDiscordConfig,
} from "../../../lib/discord";

import {
  OAUTH_STATE_COOKIE_NAME,
  isSecureCookie,
} from "../../../lib/auth";

export async function GET() {
  const {
    clientId,
    redirectUri,
  } = getDiscordConfig();

  const state =
    randomBytes(32).toString(
      "hex",
    );

  const url =
    new URL(
      "https://discord.com/oauth2/authorize",
    );

  url.searchParams.set(
    "client_id",
    clientId,
  );

  url.searchParams.set(
    "response_type",
    "code",
  );

  url.searchParams.set(
    "redirect_uri",
    redirectUri,
  );

  url.searchParams.set(
    "scope",
    "identify",
  );

  url.searchParams.set(
    "state",
    state,
  );

  const response =
    NextResponse.redirect(url);

  response.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    state,
    {
      httpOnly: true,
      secure:
        isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    },
  );

  return response;
}