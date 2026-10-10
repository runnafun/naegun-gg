import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
import { hashAdminPassword } from "@/app/lib/admin-password";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: "권한이 없습니다." },
      { status: auth.status },
    );
  }

  const accounts = await prisma.adminCredential.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({
    ok: true,
    accounts: accounts.map((item) => ({
      id: item.id,
      username: item.username,
      role: item.user.role,
      status: item.user.status,
      createdAt: item.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: "권한이 없습니다." },
      { status: auth.status },
    );
  }

  if (auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        ok: false,
        error: "최고 관리자만 관리자 계정을 생성할 수 있습니다.",
      },
      {
        status: 403,
      },
    );
  }

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
        error: "아이디와 비밀번호를 입력해주세요.",
      },
      {
        status: 400,
      },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      {
        ok: false,
        error: "비밀번호는 8자 이상이어야 합니다.",
      },
      {
        status: 400,
      },
    );
  }

  const exists = await prisma.adminCredential.findUnique({
    where: {
      username,
    },
  });

  if (exists) {
    return NextResponse.json(
      {
        ok: false,
        error: "이미 존재하는 관리자 아이디입니다.",
      },
      {
        status: 409,
      },
    );
  }

  const passwordHash = await hashAdminPassword(password);

  const created = await prisma.adminCredential.create({
    data: {
      username,
      passwordHash,
      user: {
        create: {
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
    include: {
      user: true,
    },
  });

  return NextResponse.json({
    ok: true,
    account: {
      id: created.id,
      username: created.username,
      role: created.user.role,
      status: created.user.status,
    },
  });
}
