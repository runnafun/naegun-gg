import { getTrackerPrincipal } from "@/app/lib/tracker-desktop-auth";
import { NextRequest, NextResponse } from "next/server";
import { loadTrackerScrim, getTrackerRoster } from "@/app/lib/tracker-access";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: {params: Promise<{code: string}>}) {
  const code = (await context.params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return NextResponse.json({error: "RANKED_CODE_REQUIRED"}, {status:400});
  const scrim = await loadTrackerScrim(code);
  if (!scrim) return NextResponse.json({error:"TEAM_NOT_CONFIRMED_OR_NOT_FOUND"},{status:404});
  if (!await getTrackerPrincipal(request)) return NextResponse.json({error:"TRACKER_SESSION_INVALID_OR_EXPIRED"},{status:401});
  return NextResponse.json({ok:true, code, status:scrim.status, roster:await getTrackerRoster(scrim),
    bestOf:3}, {headers:{"Cache-Control":"no-store"}});
}
