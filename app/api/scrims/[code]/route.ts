import {
  NextResponse,
} from "next/server";

import { getScrimByCode } from "@/app/lib/scrims/service";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      code: string;
    }>;
  },
) {
  const { code } =
    await context.params;

  const scrim =
    await getScrimByCode(code);

  if (!scrim) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SCRIM_NOT_FOUND",
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
