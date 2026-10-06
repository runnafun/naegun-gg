import {
  SignJWT,
  jwtVerify,
} from "jose";

import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME =
  "naegun_session";

export const OAUTH_STATE_COOKIE_NAME =
  "naegun_discord_state";

const SESSION_MAX_AGE =
  60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  role:
    | "USER"
    | "ADMIN"
    | "SUPER_ADMIN";
};

function getSecret() {
  const secret =
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET이 설정되지 않았습니다.",
    );
  }

  return new TextEncoder().encode(secret);
}

export function isSecureCookie() {
  return (
    process.env.AUTH_COOKIE_SECURE ===
    "true"
  );
}

export async function createSessionToken(
  payload: SessionPayload,
) {
  return new SignJWT({
    role: payload.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } =
      await jwtVerify(
        token,
        getSecret(),
      );

    if (!payload.sub) {
      return null;
    }

    const role = payload.role;

    if (
      role !== "USER" &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role,
    };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME,
    )?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: isSecureCookie(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};