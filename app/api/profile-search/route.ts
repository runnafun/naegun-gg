import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  searchProfiles,
} from "../../lib/profile";


export const dynamic =
  "force-dynamic";

export const revalidate = 0;


export async function GET(
  request: NextRequest,
) {
  const query =
    request.nextUrl.searchParams.get(
      "q",
    ) ?? "";


  const results =
    await searchProfiles(
      query,
    );


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
