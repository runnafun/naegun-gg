import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "../../lib/prisma";

import {
  syncRiotAccountByUserId,
} from "../../lib/riot-sync";


export const dynamic =
  "force-dynamic";

export const revalidate = 0;


const REFRESH_COOLDOWN_MS =
  30 * 1000;


function rankValue(
  tier?: string | null,
  rank?: string | null,
  lp = 0,
) {
  const tierScore:
    Record<string, number> = {
      IRON: 1,
      BRONZE: 2,
      SILVER: 3,
      GOLD: 4,
      PLATINUM: 5,
      EMERALD: 6,
      DIAMOND: 7,
      MASTER: 8,
      GRANDMASTER: 9,
      CHALLENGER: 10,
    };

  const rankScore:
    Record<string, number> = {
      IV: 1,
      III: 2,
      II: 3,
      I: 4,
    };

  if (!tier) {
    return 0;
  }

  return (
    (
      tierScore[
        tier.toUpperCase()
      ] ?? 0
    ) *
      100000 +
    (
      rankScore[
        (rank ?? "").toUpperCase()
      ] ?? 0
    ) *
      10000 +
    Math.max(
      Number(lp) || 0,
      0,
    )
  );
}


export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    const gameName =
      String(
        body.gameName ?? "",
      ).trim();

    const tagLine =
      String(
        body.tagLine ?? "",
      ).trim();

    if (
      !gameName ||
      !tagLine
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "소환사 정보가 없습니다.",
        },
        {
          status: 400,
        },
      );
    }


    const account =
      await prisma.riotAccount.findFirst({
        where: {
          gameName: {
            equals:
              gameName,

            mode:
              "insensitive",
          },

          tagLine: {
            equals:
              tagLine,

            mode:
              "insensitive",
          },
        },
      });


    if (!account) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "내전.GG에 등록되지 않은 소환사입니다.",
        },
        {
          status: 404,
        },
      );
    }


    /*
      연속 갱신 방지
    */
    if (
      account.lastSyncedAt
    ) {
      const elapsed =
        Date.now() -
        account.lastSyncedAt.getTime();

      if (
        elapsed <
        REFRESH_COOLDOWN_MS
      ) {
        const remain =
          Math.ceil(
            (
              REFRESH_COOLDOWN_MS -
              elapsed
            ) /
            1000,
          );

        return NextResponse.json(
          {
            ok: false,
            cooldown: true,
            remain,
            message:
              `${remain}초 후 다시 갱신해주세요.`,
          },
          {
            status: 429,
          },
        );
      }
    }


    console.log(
      `[PROFILE REFRESH] 시작 ${account.gameName}#${account.tagLine}`,
    );


    /*
      여기서부터 프로필 갱신과
      내전 참가 자동 갱신이
      완전히 같은 엔진을 사용한다.
    */
    const syncResult =
      await syncRiotAccountByUserId(
        account.userId,
      );


    if (!syncResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Riot 데이터 갱신에 실패했습니다.",
          sync:
            syncResult,
        },
        {
          status: 500,
        },
      );
    }


    /*
      갱신된 현재 티어 다시 조회
    */
    const refreshed =
      await prisma.riotAccount.findUnique({
        where: {
          userId:
            account.userId,
        },
      });


    /*
      탑레이팅은 현재 티어가
      기존 최고 기록보다 높을 때만 갱신한다.
    */
    if (
      refreshed?.soloTier
    ) {
      const balance =
        await prisma.balanceProfile.findUnique({
          where: {
            userId:
              account.userId,
          },
        });

      const currentValue =
        rankValue(
          refreshed.soloTier,
          refreshed.soloRank,
          refreshed.soloLp ?? 0,
        );

      const peakValue =
        rankValue(
          balance?.peakTier,
          balance?.peakRank,
          balance?.peakLp ?? 0,
        );

      if (
        currentValue >
        peakValue
      ) {
        await prisma.balanceProfile.upsert({
          where: {
            userId:
              account.userId,
          },

          create: {
            userId:
              account.userId,

            peakTier:
              refreshed.soloTier,

            peakRank:
              refreshed.soloRank,

            peakLp:
              refreshed.soloLp,
          },

          update: {
            peakTier:
              refreshed.soloTier,

            peakRank:
              refreshed.soloRank,

            peakLp:
              refreshed.soloLp,
          },
        });

        console.log(
          `[PROFILE REFRESH] 탑레이팅 갱신 ${refreshed.soloTier} ${refreshed.soloRank ?? ""} ${refreshed.soloLp ?? 0}LP`,
        );
      }
    }


    console.log(
      `[PROFILE REFRESH] 완료 ${account.gameName}#${account.tagLine}`,
      syncResult,
    );


    return NextResponse.json({
      ok: true,

      message:
        "전적 갱신이 완료되었습니다.",

      sync:
        syncResult,
    });

  } catch (error) {
    console.error(
      "[PROFILE REFRESH ERROR]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          error instanceof Error
            ? error.message
            : "전적 갱신 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
