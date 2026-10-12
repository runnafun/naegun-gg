
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { buildHistory } from "../../lib/profile";
import {
  getRecentMatchIds,
  getMatchById,
  type RiotMatchDto,
} from "../../lib/riot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE_SIZE = 20;
const SUPPORTED = new Set([400, 420, 430, 440, 490]);

function supported(match: RiotMatchDto, puuid: string) {
  return SUPPORTED.has(match.info.queueId) &&
    match.info.participants.length === 10 &&
    match.info.participants.some((p) => p.puuid === puuid);
}

export async function GET(request: NextRequest) {
  const puuid =
    request.nextUrl.searchParams.get("puuid")?.trim() ?? "";
  const start =
    Number(request.nextUrl.searchParams.get("start") ?? "40");

  if (
    !puuid ||
    !Number.isSafeInteger(start) ||
    start < 0 ||
    start > 2000
  ) {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  const account = await prisma.riotAccount.findFirst({
    where: {
      puuid,
      user: { status: { not: "DELETED" } }
    },
    select: { puuid: true }
  });

  if (!account) {
    return NextResponse.json(
      { error: "등록된 계정이 아닙니다." },
      { status: 404 }
    );
  }

  try {
    const ids = await getRecentMatchIds(
      puuid,
      PAGE_SIZE,
      start
    );

    if (ids.length === 0) {
      return NextResponse.json({
        matches: [],
        nextStart: start,
        hasMore: false
      });
    }

    const rows = await prisma.riotMatchCache.findMany({
      where: { id: { in: ids } },
      select: { id: true, data: true }
    });

    const byId = new Map<string, RiotMatchDto>(
      rows.map((row) => [
        row.id,
        row.data as unknown as RiotMatchDto
      ])
    );

    for (const id of ids) {
      if (byId.has(id)) continue;

      const match = await getMatchById(id);

      if (!supported(match, puuid)) continue;

      await prisma.riotMatchCache.upsert({
        where: { id },
        create: {
          id,
          puuid,
          queueId: match.info.queueId,
          gameCreation: BigInt(match.info.gameCreation),
          gameDuration: match.info.gameDuration,
          data: match as any
        },
        update: {}
      });

      byId.set(id, match);
    }

    const matches = ids
      .map((id) => byId.get(id))
      .filter(
        (match): match is RiotMatchDto =>
          !!match && supported(match, puuid)
      );

    return NextResponse.json(
      {
        matches: buildHistory(matches, puuid),
        nextStart: start + ids.length,
        hasMore: ids.length === PAGE_SIZE
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("[PROFILE MATCHES MORE]", error);

    return NextResponse.json(
      {
        error: "전적을 불러오지 못했습니다. 다시 시도해 주세요."
      },
      { status: 503 }
    );
  }
}
