import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getScrims } from "@/app/lib/scrims/service";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export async function GET(
  request: NextRequest,
) {
  const params =
    request.nextUrl.searchParams;

  const rawType =
    params.get("type");

  const rawStatus =
    params.get("status");

  const active =
    params.get("active") === "1";

  const limit =
    Number(params.get("limit")) ||
    100;

  const includeParticipants =
    params.get("participants") === "1";

  const type =
    rawType === "NORMAL" ||
    rawType === "RANKED"
      ? rawType
      : undefined;

  const allowedStatuses = new Set([
    "OPEN",
    "CLOSED",
    "TEAM_SELECTION",
    "IN_PROGRESS",
    "FINISHED",
    "CANCELLED",
  ]);

  const status =
    rawStatus &&
    allowedStatuses.has(rawStatus)
      ? (rawStatus as any)
      : undefined;

  const data = await getScrims({
    type,
    status,
    activeOnly: active,
    limit,
    includeParticipants,
  });

  return NextResponse.json(
    data,
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
