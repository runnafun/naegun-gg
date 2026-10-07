export async function requireAdmin(request: Request) {
  const baseUrl =
    process.env.APP_URL ||
    new URL(request.url).origin;

  const cookie = request.headers.get("cookie") ?? "";

  const response = await fetch(
    new URL("/api/auth/me", baseUrl),
    {
      method: "GET",
      headers: {
        cookie,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return {
      ok: false as const,
      status: 401,
      user: null,
    };
  }

  const data = await response.json().catch(() => null);

  const user =
    data?.user ??
    data ??
    null;

  const role = user?.role;

  if (
    !user ||
    (role !== "ADMIN" &&
      role !== "SUPER_ADMIN")
  ) {
    return {
      ok: false as const,
      status: 403,
      user,
    };
  }

  return {
    ok: true as const,
    status: 200,
    user,
  };
}
