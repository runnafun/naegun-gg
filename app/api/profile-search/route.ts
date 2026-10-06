import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  searchProfiles,
} from "../../lib/profile";


export async function GET(
  request: NextRequest
) {
  const query =
    request.nextUrl.searchParams.get(
      "q"
    ) ?? "";


  const results =
    searchProfiles(
      query
    );


  return NextResponse.json({
    results,
  });
}