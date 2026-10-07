import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";
import {
  balanceTeams,
  tierToScore,
} from "@/app/lib/team-balance";
import { requireAdmin } from "@/app/lib/admin-auth";

export const dynamic =
  "force-dynamic";

async function loadScrim(
  code: string,
) {
  return prisma.scrim.findUnique({
    where: {
      code,
    },

    include: {
      participants: {
        where: {
          status: "CONFIRMED",
        },

        include: {
          user: {
            include: {
              discordAccount: true,
              riotAccount: true,
              balanceProfile: true,
              preferences: true,
            },
          },
        },
      },
    },
  });
}

async function ensureProfiles(
  scrim: NonNullable<
    Awaited<
      ReturnType<typeof loadScrim>
    >
  >,
) {
  for (const participant of scrim.participants) {
    const user = participant.user;
    const riot = user.riotAccount;

    if (!riot) {
      throw new Error(
        `${user.id} 사용자의 Riot 계정이 없습니다.`,
      );
    }

    if (!user.balanceProfile) {
      const peakTier = riot.soloTier;
      const peakRank = riot.soloRank;
      const peakLp = riot.soloLp;

      const peakScore =
        tierToScore({
          tier: peakTier,
          rank: peakRank,
          lp: peakLp,
        });

      await prisma.balanceProfile.create({
        data: {
          userId: user.id,

          peakTier,
          peakRank,
          peakLp,

          tierEvaluation:
            peakScore,

          scrimRankScore: 50,
        },
      });
    }
  }
}

async function buildPayload(
  code: string,
) {
  let scrim =
    await loadScrim(code);

  if (!scrim) {
    return {
      error: "SCRIM_NOT_FOUND",
      status: 404,
    } as const;
  }

  if (
    scrim.participants.length !== 10
  ) {
    return {
      error: "CONFIRMED_PLAYERS_NOT_10",
      status: 409,
      count:
        scrim.participants.length,
    } as const;
  }

  await ensureProfiles(scrim);

  scrim = await loadScrim(code);

  if (!scrim) {
    return {
      error: "SCRIM_NOT_FOUND",
      status: 404,
    } as const;
  }

  const players =
    scrim.participants.map(
      (participant) => {
        const user =
          participant.user;

        const riot =
          user.riotAccount!;

        const profile =
          user.balanceProfile!;

        const peakTier =
          profile.peakTier ??
          riot.soloTier;

        const peakRank =
          profile.peakRank ??
          riot.soloRank;

        const peakLp =
          profile.peakLp ??
          riot.soloLp;

        const peakScore =
          tierToScore({
            tier: peakTier,
            rank: peakRank,
            lp: peakLp,
          });

        return {
          userId: user.id,

          name:
            riot.gameName &&
            riot.tagLine
              ? `${riot.gameName}#${riot.tagLine}`
              : user.discordAccount
                    ?.globalName ??
                user.discordAccount
                    ?.username ??
                user.id,

          currentTier: {
            tier: riot.soloTier,
            rank: riot.soloRank,
            lp: riot.soloLp,
          },

          peakTier: {
            tier: peakTier,
            rank: peakRank,
            lp: peakLp,
          },

          tierEvaluation:
            profile.tierEvaluation ??
            peakScore,

          scrimRankScore:
            profile.scrimRankScore ??
            50,
        };
      },
    );

  return {
    scrim,
    players,
  } as const;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      code: string;
    }>;
  },
) {
  const admin =
    await requireAdmin(request);

  if (!admin.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          admin.status === 401
            ? "UNAUTHORIZED"
            : "FORBIDDEN",
      },
      {
        status: admin.status,
      },
    );
  }

  const { code: rawCode } =
    await context.params;

  const code =
    rawCode.trim().toUpperCase();

  const payload =
    await buildPayload(code);

  if ("error" in payload) {
    return NextResponse.json(
      {
        ok: false,
        ...payload,
      },
      {
        status: payload.status,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    code,
    status:
      payload.scrim.status,
    players: payload.players,
  });
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      code: string;
    }>;
  },
) {
  const admin =
    await requireAdmin(request);

  if (!admin.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          admin.status === 401
            ? "UNAUTHORIZED"
            : "FORBIDDEN",
      },
      {
        status: admin.status,
      },
    );
  }

  const { code: rawCode } =
    await context.params;

  const code =
    rawCode.trim().toUpperCase();

  const payload =
    await buildPayload(code);

  if ("error" in payload) {
    return NextResponse.json(
      {
        ok: false,
        ...payload,
      },
      {
        status: payload.status,
      },
    );
  }

  const result =
    balanceTeams(payload.players);

  if (
    payload.scrim.status === "CLOSED"
  ) {
    await prisma.scrim.update({
      where: {
        code,
      },
      data: {
        status:
          "TEAM_SELECTION",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    code,
    formula: {
      br:
        "tierEvaluation*0.45 + currentTier*0.25 + peakTier*0.15 + scrimRank*0.15",
      penalty:
        "totalDiff*0.65 + topDiff*0.20 + distributionDiff*0.15",
    },
    result,
  });
}
