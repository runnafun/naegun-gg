import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getScrimByCode,
} from "@/app/lib/scrims/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      code: string;
    }>;
  },
) {
  const { code } = await context.params;

  const normalized =
    String(code ?? "")
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();

  if (!/^([NR])\d{1,6}$/.test(normalized)) {
    return NextResponse.json(
      {
        ok: false,
        message: "올바른 내전 코드를 입력해주세요.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const scrim =
    await getScrimByCode(normalized);

  if (!scrim) {
    return NextResponse.json(
      {
        ok: false,
        message: "내전을 찾을 수 없습니다.",
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      scrim,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
