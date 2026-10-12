import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";
const DAY = 24 * 60 * 60 * 1000;

function result(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return result("관리자 권한이 필요합니다.", admin.status);
  const userId = new URL(request.url).searchParams.get("userId")?.trim();
  if (!userId) return result("회원 ID가 필요합니다.", 400);
  const account = await prisma.riotAccount.findUnique({
    where: { userId },
    select: { gameName: true, tagLine: true, linkedAt: true, lastChangedAt: true },
  });
  if (!account) return NextResponse.json({ ok: true, account: null });
  const base = account.lastChangedAt ?? account.linkedAt;
  const nextAllowedAt = new Date(base.getTime() + 30 * DAY);
  return NextResponse.json({
    ok: true,
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      linkedAt: account.linkedAt,
      lastChangedAt: account.lastChangedAt,
      nextAllowedAt,
      canChange: Date.now() >= nextAllowedAt.getTime(),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return result("관리자 권한이 필요합니다.", admin.status);

  let body: { userId?: unknown; action?: unknown; gameName?: unknown; tagLine?: unknown; reason?: unknown };
  try { body = await request.json(); }
  catch { return result("요청 형식이 올바르지 않습니다.", 400); }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const action = body.action;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!userId || userId.length > 128) return result("회원 ID가 올바르지 않습니다.", 400);
  if (reason.length < 5 || reason.length > 200) return result("작업 사유를 5~200자로 입력해 주세요.", 400);
  if (action !== "RESET_COOLDOWN" && action !== "CHANGE_ACCOUNT") return result("지원하지 않는 작업입니다.", 400);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, riotAccount: true } });
  if (!user) return result("회원을 찾지 못했습니다.", 404);

  // 쿨타임 해제는 계정/PUUID를 변경하지 않는다. 사용자와 봇이 정상 재등록하면 동기화된다.
  if (action === "RESET_COOLDOWN") {
    if (!user.riotAccount) return result("Riot 계정 미연동 회원입니다.", 409);
    const resetTime = new Date(Date.now() - 31 * DAY);
    try {
      await prisma.$transaction(async (tx) => {
        const current = await tx.riotAccount.findUniqueOrThrow({ where: { userId } });
        await tx.riotAccount.update({ where: { userId }, data: { lastChangedAt: resetTime } });
        await tx.adminAuditLog.create({ data: {
          adminId: admin.user.id, action: "ADMIN_RIOT_COOLDOWN_RESET", targetType: "User", targetId: userId,
          beforeData: { gameName: current.gameName, tagLine: current.tagLine, lastChangedAt: current.lastChangedAt?.toISOString() ?? null },
          afterData: { gameName: current.gameName, tagLine: current.tagLine, lastChangedAt: resetTime.toISOString() }, reason,
        } });
      });
      return NextResponse.json({ ok: true, message: "30일 변경 제한을 해제했습니다. 사용자가 Discord 봇에서 계정을 다시 등록할 수 있습니다." });
    } catch (error) { console.error("RIOT_ADMIN_COOLDOWN", error); return result("변경 제한 해제에 실패했습니다.", 500); }
  }

  const gameName = typeof body.gameName === "string" ? body.gameName.trim() : "";
  const tagLine = typeof body.tagLine === "string" ? body.tagLine.trim().replace(/^#/, "") : "";
  if (gameName.length < 1 || gameName.length > 32 || tagLine.length < 1 || tagLine.length > 16) {
    return result("Riot ID와 태그를 확인해 주세요.", 400);
  }

  const key = process.env.RIOT_API_KEY ?? process.env.RIOT_API_TOKEN;
  if (!key) return result("EC2 서버에 RIOT_API_KEY가 설정되지 않았습니다. 변경 제한 해제 기능은 사용 가능합니다.", 503);
  let riot: { puuid?: string; gameName?: string; tagLine?: string };
  try {
    const lookupUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const response = await fetch(lookupUrl, { headers: { "X-Riot-Token": key }, cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (response.status === 404) return result("Riot API에서 해당 계정을 찾지 못했습니다.", 404);
    if (response.status === 401 || response.status === 403) return result("Riot API 키가 유효하지 않거나 만료되었습니다.", 503);
    if (response.status === 429) return result("Riot API 요청 제한입니다. 잠시 후 다시 시도해 주세요.", 429);
    if (!response.ok) return result(`Riot API 조회에 실패했습니다. (HTTP ${response.status})`, 502);
    riot = await response.json();
  } catch (error) {
    console.error("RIOT_ADMIN_LOOKUP", error);
    return result("Riot API 연결에 실패했습니다.", 502);
  }
  if (!riot.puuid || !riot.gameName || !riot.tagLine) return result("Riot API에서 계정 식별 정보를 가져오지 못했습니다.", 502);

  // NAEGUN_RIOT_ACTIVE_GUARD_V16
  // Riot ID의 닉네임/태그만 변경돼 PUUID가 같으면 과거 참가 내전과 무관하게 갱신한다.
  // 실제 PUUID가 달라지는 계정 교체일 때만, 현재 진행 중이거나 막 모집을 마친 내전을 보호한다.
  if (user.riotAccount?.puuid !== riot.puuid) {
    const recentCutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const participation = await prisma.scrimParticipant.findFirst({
      where: {
        userId,
        status: "CONFIRMED",
        scrim: {
          OR: [
            { status: { in: ["TEAM_SELECTION", "IN_PROGRESS"] } },
            { status: { in: ["OPEN", "CLOSED"] }, createdAt: { gte: recentCutoff } },
          ],
        },
      },
      select: { scrim: { select: { code: true, status: true } } },
    });
    if (participation) {
      return result(
        `${participation.scrim.code} 내전이 ${participation.scrim.status} 상태라 다른 PUUID로 변경할 수 없습니다. 같은 Riot 계정의 닉네임 변경은 가능합니다.`,
        409,
      );
    }
  }

  try {
    const changed = await prisma.$transaction(async (tx) => {
      const other = await tx.riotAccount.findUnique({ where: { puuid: riot.puuid! }, select: { userId: true } });
      if (other && other.userId !== userId) throw new Error("ACCOUNT_TAKEN");
      const existing = await tx.riotAccount.findUnique({ where: { userId } });
      const samePuuid = existing?.puuid === riot.puuid;
      if (existing && !samePuuid) {
        await tx.riotAccountHistory.create({ data: {
          riotAccountId: existing.id, oldPuuid: existing.puuid,
          oldGameName: existing.gameName, oldTagLine: existing.tagLine,
          newPuuid: riot.puuid!, newGameName: riot.gameName!, newTagLine: riot.tagLine!,
        } });
      }
      const updated = await tx.riotAccount.upsert({
        where: { userId },
        update: {
          puuid: riot.puuid!, gameName: riot.gameName!, tagLine: riot.tagLine!,
          ...(samePuuid ? {} : { lastChangedAt: new Date(), lastSyncedAt: null, soloTier: null, soloRank: null, soloLp: null, profileIconId: null }),
        },
        create: {
          userId, puuid: riot.puuid!, gameName: riot.gameName!, tagLine: riot.tagLine!,
          lastChangedAt: new Date(),
        },
      });
      await tx.adminAuditLog.create({ data: {
        adminId: admin.user.id, action: "ADMIN_RIOT_ACCOUNT_CHANGED", targetType: "User", targetId: userId,
        beforeData: existing ? { puuid: existing.puuid, gameName: existing.gameName, tagLine: existing.tagLine } : { linked: false },
        afterData: { puuid: updated.puuid, gameName: updated.gameName, tagLine: updated.tagLine }, reason,
      } });
      return updated;
    });
    return NextResponse.json({ ok: true, message: `${changed.gameName}#${changed.tagLine} 계정으로 변경했습니다. Discord 봇의 기존 계정 정보도 다시 동기화해야 합니다.` });
  } catch (error) {
    if ((error as Error).message === "ACCOUNT_TAKEN" || (error as { code?: string }).code === "P2002") {
      return result("다른 내전.GG 회원에게 이미 연결된 Riot 계정입니다.", 409);
    }
    console.error("RIOT_ADMIN_CHANGE", error);
    return result("Riot 계정 변경에 실패했습니다.", 500);
  }
}
