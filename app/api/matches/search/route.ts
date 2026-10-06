import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  searchMatchLookups,
} from "../../../lib/matchLookup";


export async function GET(
  request: NextRequest
) {
  const query =
    request.nextUrl.searchParams.get(
      "q"
    ) ?? "";


  const results =
    searchMatchLookups(
      query
    );


  return NextResponse.json({
    results,
  });
}