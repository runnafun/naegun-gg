import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getScrimByCode,
} from "@/app/lib/scrims/service";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      code: string;
    }>;
  },
) {
  const { code } =
    await context.params;

  const scrim =
    await getScrimByCode(
      code,
    );

  if (!scrim) {
    return NextResponse.json(
      {
        error:
          "내전을 찾을 수 없습니다.",
      },
      {
        status: 404,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  }

  return NextResponse.json(
    {
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
