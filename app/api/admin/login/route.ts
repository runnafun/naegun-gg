import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/app/lib/auth";

import {
  hashAdminPassword,
  verifyAdminPassword,
} from "@/app/lib/admin-password";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username =
      typeof body?.username === "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!username || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: "ID와 비밀번호를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    let credential =
      await prisma.adminCredential.findUnique({
        where: {
          username,
        },
        include: {
          user: true,
        },
      });

    if (!credential) {
      const bootstrapId =
        process.env.ADMIN_BOOTSTRAP_ID?.trim();

      const bootstrapPassword =
        process.env.ADMIN_BOOTSTRAP_PASSWORD;

      const adminCount =
        await prisma.adminCredential.count();

      if (
        adminCount === 0 &&
        bootstrapId &&
        bootstrapPassword &&
        username === bootstrapId &&
        password === bootstrapPassword
      ) {
        const passwordHash =
          await hashAdminPassword(password);

        credential =
          await prisma.adminCredential.create({
            data: {
              username,
              passwordHash,
              user: {
                create: {
                  role: "SUPER_ADMIN",
                  status: "ACTIVE",
                },
              },
            },
            include: {
              user: true,
            },
          });
      } else {
        return NextResponse.json(
          {
            ok: false,
            error: "아이디 또는 비밀번호가 올바르지 않습니다.",
          },
          {
            status: 401,
          },
        );
      }
    } else {
      const valid =
        await verifyAdminPassword(
          password,
          credential.passwordHash,
        );

      if (!valid) {
        return NextResponse.json(
          {
            ok: false,
            error: "아이디 또는 비밀번호가 올바르지 않습니다.",
          },
          {
            status: 401,
          },
        );
      }
    }

    if (
      credential.user.status !== "ACTIVE" ||
      (
        credential.user.role !== "ADMIN" &&
        credential.user.role !== "SUPER_ADMIN"
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "관리자 권한이 없습니다.",
        },
        {
          status: 403,
        },
      );
    }

    const token =
      await createSessionToken({
        userId: credential.user.id,
        role: credential.user.role,
      });

    const response =
      NextResponse.json({
        ok: true,
        user: {
          id: credential.user.id,
          username: credential.username,
          role: credential.user.role,
        },
      });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions,
    );

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "로그인 처리 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
