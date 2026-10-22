import { getTrackerPrincipal } from "@/app/lib/tracker-desktop-auth";
import { NextRequest, NextResponse } from "next/server";
import { loadTrackerScrim, getTrackerRoster } from "@/app/lib/tracker-access";
import { prisma } from "@/app/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: {params: Promise<{code: string}>}) {
  const code = (await context.params).code.trim().toUpperCase();
  if (!/^R\d{3,}$/.test(code)) return NextResponse.json({error: "RANKED_CODE_REQUIRED"}, {status:400});
  const principal = await getTrackerPrincipal(request);
  if (!principal) return NextResponse.json({error:"TRACKER_SESSION_INVALID_OR_EXPIRED"},{status:401});
  const scrim = await loadTrackerScrim(code);
  if (scrim) return NextResponse.json({ok:true, code, ready:true, status:scrim.status,
    roster:await getTrackerRoster(scrim), bestOf:3}, {headers:{"Cache-Control":"no-store"}});
  const pending = await prisma.scrim.findUnique({where:{code},select:{type:true,status:true,
    participants:{where:{status:"CONFIRMED"},select:{userId:true}}}});
  if (pending?.type === "RANKED" && pending.status === "TEAM_SELECTION" &&
      pending.participants.length === 10 && pending.participants.some(p=>p.userId===principal.userId)) {
    return NextResponse.json({ok:true,code,status:"TEAM_SELECTION",ready:false,
      message:"트래커 연결 완료 · 디스코드 팀 확정 대기"},{headers:{"Cache-Control":"no-store"}});
  }
  return NextResponse.json({error:"TEAM_NOT_READY_OR_NOT_FOUND"},{status:404});
}
