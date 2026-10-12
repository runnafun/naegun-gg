import { prisma } from "@/app/lib/prisma";
import { tierToScore } from "@/app/lib/team-balance";
import { tierToAbsoluteLp } from "@/app/lib/balance-lp";

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
              stats: true,
              defenseStats: true,
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

export async function buildRankedPayload(
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

  if (scrim.type !== "RANKED") {
    return {
      error: "RANKED_ONLY",
      status: 403,
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
          evaluationLpOffset: profile.evaluationLpOffset ?? 0,
          evaluationBaseTier: {
            tier: profile.evaluationBaseTier ?? riot.soloTier,
            rank: profile.evaluationBaseTier ? profile.evaluationBaseRank : riot.soloRank,
            lp: profile.evaluationBaseTier ? profile.evaluationBaseLp : riot.soloLp,
          },

          scrimRankScore:
            profile.scrimRankScore ??
            50,
          scrimGames:
            (user.stats?.wins ?? 0) +
            (user.stats?.losses ?? 0),
          defenseProgress:
            user.defenseStats?.progress ?? 0,
          mainPosition:
            participant.mainPosition,
          subPosition:
            participant.subPosition,
        };
      },
    );

  // 티어가 없는 선수는 가짜 35점으로 섞지 말고 관리자 기준 티어를 요구한다.
  const missing = players.find(p => tierToAbsoluteLp(p.evaluationBaseTier) === null);
  if (missing) {
    return {
      error: `${missing.name}: 솔로랭크가 없습니다. 관리자 > 티어 평가에서 수동 기준 티어를 지정해 주세요.`,
      status: 409,
    } as const;
  }

  return {
    scrim,
    players,
  } as const;
}
