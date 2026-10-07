import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  searchMatchLookups,
} from "../../../lib/matchLookup";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: NextRequest
) {
  const query =
    request.nextUrl.searchParams.get(
      "q"
    ) ?? "";

  const results =
    await searchMatchLookups(query);

  return NextResponse.json(
    {
      results,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
