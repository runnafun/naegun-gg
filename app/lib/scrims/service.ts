import { prisma } from "@/app/lib/prisma";
import type {
  PublicScrim,
  PublicScrimStatus,
  ScrimListResponse,
} from "./types";

const PUBLIC_STATUSES: PublicScrimStatus[] = [
  "OPEN",
  "CLOSED",
  "TEAM_SELECTION",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED",
];

type ListOptions = {
  type?: "NORMAL" | "RANKED";
  status?: PublicScrimStatus;
  activeOnly?: boolean;
  limit?: number;
  includeParticipants?: boolean;
};

function toPublicScrim(
  scrim: any,
  includeParticipants = false,
): PublicScrim {
  const participants = Array.isArray(scrim.participants)
    ? scrim.participants
    : [];

  const confirmed = participants.filter(
    (p: any) => p.status === "CONFIRMED",
  );

  const waiting = participants.filter(
    (p: any) => p.status === "WAITING",
  );

  return {
    id: scrim.id,
    code: scrim.code,
    type: scrim.type,
    rule: scrim.rule,
    status: scrim.status,
    bestOf: scrim.bestOf,
    startAt: scrim.startAt.toISOString(),
    maxPlayers: scrim.maxPlayers,
    participantCount: confirmed.length,
    waitingCount: waiting.length,
    forumThreadId: scrim.forumThreadId,
    starterMessageId: scrim.starterMessageId,
    createdAt: scrim.createdAt.toISOString(),
    updatedAt: scrim.updatedAt.toISOString(),

    ...(includeParticipants
      ? {
          participants: participants
            .filter(
              (p: any) =>
                p.status === "CONFIRMED" ||
                p.status === "WAITING",
            )
            .map((p: any) => ({
              userId: p.userId,
              riotId:
                p.user?.riotAccount?.gameName &&
                p.user?.riotAccount?.tagLine
                  ? `${p.user.riotAccount.gameName}#${p.user.riotAccount.tagLine}`
                  : null,

              profileIconId:
                p.user?.riotAccount?.profileIconId ?? null,

              currentTier:
                p.user?.riotAccount?.soloTier ?? null,
              currentRank:
                p.user?.riotAccount?.soloRank ?? null,
              currentLp:
                p.user?.riotAccount?.soloLp ?? null,

              peakTier:
                p.user?.balanceProfile?.peakTier ??
                p.user?.riotAccount?.soloTier ??
                null,
              peakRank:
                p.user?.balanceProfile?.peakRank ??
                p.user?.riotAccount?.soloRank ??
                null,
              peakLp:
                p.user?.balanceProfile?.peakLp ??
                p.user?.riotAccount?.soloLp ??
                null,

              tierEvaluation:
                p.user?.balanceProfile?.tierEvaluation ?? null,
              scrimRankScore:
                p.user?.balanceProfile?.scrimRankScore ?? 50,

              wins:
                p.user?.stats?.wins ?? 0,
              losses:
                p.user?.stats?.losses ?? 0,

              mainPosition: p.mainPosition,
              subPosition: p.subPosition,
              team: p.team,
              status: p.status,
            })),
        }
      : {}),
  };
}

function participantInclude() {
  return {
    user: {
      include: {
        riotAccount: true,
        balanceProfile: true,
        stats: true,
      },
    },
  } as const;
}

export async function getScrims(
  options: ListOptions = {},
): Promise<ScrimListResponse> {
  const {
    type,
    status,
    activeOnly = false,
    limit = 100,
    includeParticipants = false,
  } = options;

  const statusFilter = status
    ? status
    : activeOnly
      ? {
          in: [
            "OPEN",
            "CLOSED",
            "TEAM_SELECTION",
            "IN_PROGRESS",
          ],
        }
      : {
          in: PUBLIC_STATUSES,
        };

  const scrims = await prisma.scrim.findMany({
    where: {
      ...(type ? { type } : {}),
      status: statusFilter as any,
    },

    orderBy: [
      { startAt: "asc" },
      { createdAt: "desc" },
    ],

    take: Math.min(
      Math.max(limit, 1),
      200,
    ),

    include: {
      participants: {
        where: {
          status: {
            in: [
              "CONFIRMED",
              "WAITING",
            ],
          },
        },

        ...(includeParticipants
          ? { include: participantInclude() }
          : {}),
      },
    },
  });

  return {
    items: scrims.map((scrim) =>
      toPublicScrim(
        scrim,
        includeParticipants,
      ),
    ),
    total: scrims.length,
    generatedAt: new Date().toISOString(),
  };
}

export async function getScrimByCode(
  rawCode: string,
) {
  const code =
    rawCode.trim().replace(/\s+/g, "").toUpperCase();

  const scrim =
    await prisma.scrim.findUnique({
      where: { code },

      include: {
        participants: {
          where: {
            status: {
              in: [
                "CONFIRMED",
                "WAITING",
              ],
            },
          },

          include: participantInclude(),
        },

        games: {
          orderBy: {
            gameNumber: "asc",
          },
        },
      },
    });

  if (
    !scrim ||
    scrim.status === "DELETED"
  ) {
    return null;
  }

  return {
    ...toPublicScrim(scrim, true),

    games: scrim.games.map(
      (game) => ({
        gameNumber: game.gameNumber,
        status: game.status,
        winnerTeam: game.winnerTeam,
        startedAt:
          game.startedAt?.toISOString() ?? null,
        finishedAt:
          game.finishedAt?.toISOString() ?? null,
      }),
    ),
  };
}

export async function searchScrimsByCode(
  rawQuery: string,
  limit = 8,
) {
  const query =
    rawQuery.trim().replace(/\s+/g, "").toUpperCase();

  if (!query) {
    return [];
  }

  const scrims =
    await prisma.scrim.findMany({
      where: {
        code: {
          startsWith: query,
          mode: "insensitive",
        },
        status: {
          not: "DELETED",
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: Math.min(
        Math.max(limit, 1),
        20,
      ),

      include: {
        participants: {
          where: {
            status: {
              in: [
                "CONFIRMED",
                "WAITING",
              ],
            },
          },
        },
      },
    });

  return scrims.map((scrim) =>
    toPublicScrim(scrim, false),
  );
}
