import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

export const dynamic = "force-dynamic";

type ParticipantResult = {
  userId?: string;
  discordUserId?: string;
  win?: boolean;
  oldScore?: number;
  newScore?: number;
  usedTicket?: boolean;
  earnedTicket?: number;
  progress?: number;
  tickets?: number;
  coins?: number;
  isMvp?: boolean;
  isAce?: boolean;
};
type Settlement = {
  code?: string;
  wins?: { A?: number; B?: number };
  participants?: ParticipantResult[];
};
type Receipt = { settlementLogId?: string; userId?: string };

function objectOrNull<T>(value: unknown): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as T;
}
function unauthorized() {
  return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
}
function deliveredKey(settlementLogId: string, userId: string) {
  return `${settlementLogId}:${userId}`;
}

// 완료된 정산 로그를 읽기만 함. 실제 보상/랭크 계산은 절대 재실행하지 않음.
export async function GET(request: NextRequest) {
  if (!isValidBotRequest(request)) return unauthorized();
  try {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const settlements = await prisma.adminAuditLog.findMany({
      where: {
        action: "RANKED_SETTLED",
        targetType: "Scrim",
        createdAt: { gte: since },
      },
      select: { id: true, targetId: true, afterData: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    if (settlements.length === 0) {
      return NextResponse.json({ ok: true, updates: [] }, { headers: { "Cache-Control": "no-store" } });
    }
    const targetIds = [...new Set(settlements.map((s) => s.targetId).filter((x): x is string => Boolean(x)))];
    const receipts = await prisma.adminAuditLog.findMany({
      where: {
        action: "RANKED_RESULT_DM_SENT",
        targetType: "Scrim",
        targetId: { in: targetIds },
      },
      select: { afterData: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    const sent = new Set(
      receipts.map((r) => {
        const data = objectOrNull<Receipt>(r.afterData);
        return deliveredKey(data?.settlementLogId ?? "", data?.userId ?? "");
      }),
    );
    const updates: Array<Record<string, unknown>> = [];
    for (const log of settlements) {
      const data = objectOrNull<Settlement>(log.afterData);
      if (!data?.code || !/^R\d+$/i.test(data.code) || !Array.isArray(data.participants)) continue;
      for (const p of data.participants) {
        if (!p.userId || !p.discordUserId) continue;
        if (sent.has(deliveredKey(log.id, p.userId))) continue;
        updates.push({
          settlementLogId: log.id,
          userId: p.userId,
          discordUserId: p.discordUserId,
          code: data.code,
          wins: data.wins ?? null,
          win: p.win === true,
          oldScore: Number(p.oldScore ?? 0),
          newScore: Number(p.newScore ?? 0),
          usedTicket: p.usedTicket === true,
          earnedTicket: Number(p.earnedTicket ?? 0),
          progress: Number(p.progress ?? 0),
          tickets: Number(p.tickets ?? 0),
          coins: Number(p.coins ?? 0),
          isMvp: p.isMvp === true,
          isAce: p.isAce === true,
        });
        if (updates.length >= 30) break;
      }
      if (updates.length >= 30) break;
    }
    return NextResponse.json({ ok: true, updates }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RANK_RESULT_DM_LIST", error);
    return NextResponse.json({ ok: false, error: "DM_LIST_FAILED" }, { status: 500 });
  }
}

// 디스코드가 개인 DM 발송에 성공한 이후에만 호출됨. 보상 재지급 없이 발송 기록만 저장.
export async function POST(request: NextRequest) {
  if (!isValidBotRequest(request)) return unauthorized();
  let body: { settlementLogId?: string; userId?: string; discordUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }
  const { settlementLogId, userId, discordUserId } = body;
  if (typeof settlementLogId !== "string" || typeof userId !== "string" || typeof discordUserId !== "string" ||
      !settlementLogId || !userId || !discordUserId) {
    return NextResponse.json({ ok: false, error: "INVALID_ACK" }, { status: 400 });
  }
  try {
    const log = await prisma.adminAuditLog.findFirst({
      where: { id: settlementLogId, action: "RANKED_SETTLED", targetType: "Scrim" },
      select: { targetId: true, afterData: true },
    });
    const settlement = objectOrNull<Settlement>(log?.afterData);
    if (!log || !log.targetId || !Array.isArray(settlement?.participants) ||
        !settlement.participants.some((p) => p.userId === userId && p.discordUserId === discordUserId)) {
      return NextResponse.json({ ok: false, error: "UNKNOWN_SETTLEMENT_MEMBER" }, { status: 404 });
    }
    const past = await prisma.adminAuditLog.findMany({
      where: { action: "RANKED_RESULT_DM_SENT", targetType: "Scrim", targetId: log.targetId },
      select: { afterData: true },
      take: 500,
    });
    if (past.some((r) => {
      const sent = objectOrNull<Receipt>(r.afterData);
      return sent?.settlementLogId === settlementLogId && sent?.userId === userId;
    })) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    await prisma.adminAuditLog.create({
      data: {
        action: "RANKED_RESULT_DM_SENT",
        targetType: "Scrim",
        targetId: log.targetId,
        reason: "Discord ranked BO3 settlement DM delivered",
        afterData: { settlementLogId, userId, discordUserId },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RANK_RESULT_DM_ACK", error);
    return NextResponse.json({ ok: false, error: "DM_ACK_FAILED" }, { status: 500 });
  }
}
