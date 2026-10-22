import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getScrims } from "@/app/lib/scrims/service";
import { requireAdmin } from "@/app/lib/admin-auth";

// naegun-scrim-list-cache-v2
// 공개 내전 목록 조회 결과를 5초간 재사용합니다.
// 관리자 전체 기록 조회는 캐시하지 않습니다.

type CachedScrimData =
  Awaited<ReturnType<typeof getScrims>>;

type ScrimQueryOptions =
  NonNullable<Parameters<typeof getScrims>[0]>;

const scrimListCache = new Map<
  string,
  {
    expiresAt: number;
    value: CachedScrimData;
  }
>();

const scrimListPending = new Map<
  string,
  Promise<CachedScrimData>
>();

async function getCachedScrims(
  options: ScrimQueryOptions,
): Promise<CachedScrimData> {
  // 관리자 기록은 항상 실시간으로 조회합니다.
  if (options.includeHistory) {
    return getScrims(options);
  }

  const key = JSON.stringify(options);
  const now = Date.now();

  const cached = scrimListCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const pending = scrimListPending.get(key);

  if (pending) {
    return pending;
  }

  // 동일 조건의 동시 요청은 하나의 DB 작업만 수행합니다.
  const task = getScrims(options);
  scrimListPending.set(key, task);

  try {
    const value = await task;

    // 저용량 EC2의 메모리 사용량을 제한합니다.
    if (scrimListCache.size >= 16) {
      scrimListCache.clear();
    }

    scrimListCache.set(key, {
      expiresAt: Date.now() + 5000,
      value,
    });

    return value;
  } finally {
    if (scrimListPending.get(key) === task) {
      scrimListPending.delete(key);
    }
  }
}



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

  // 운영 기록 전체 보기: 관리자 인증 필수.
  const includeHistory = params.get("history") === "1";
  if (includeHistory) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json(
      { ok: false, error: "ADMIN_REQUIRED" }, { status: auth.status },
    );
  }

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

  const data = await getCachedScrims({
    type,
    status,
    activeOnly: active,
    limit,
    includeParticipants,
    includeHistory,
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
