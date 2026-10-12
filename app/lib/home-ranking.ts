import { prisma } from "./prisma";
import { getDiscordAvatarUrl } from "./discord";

export type HomeRankingUser = {
  puuid: string;
  rank: number;
  gameName: string;
  tagLine: string;
  tier: string;
  avatarUrl: string;
};

const RANKS = [
  "F", "E", "D", "C", "B", "A", "S"
];

const DEFAULT_AVATAR =
  "https://cdn.discordapp.com/embed/avatars/0.png";

export async function getHomeRankings():
  Promise<HomeRankingUser[]> {

  const accounts = await prisma.riotAccount.findMany({
    where: {
      user: {
        status: { not: "DELETED" },
      },
    },
    select: {
      puuid: true,
      gameName: true,
      tagLine: true,
      linkedAt: true,

      user: {
        select: {
          defenseStats: {
            select: { progress: true },
          },

          stats: {
            select: {
              wins: true,
              losses: true,
            },
          },

          discordAccount: {
            select: {
              discordUserId: true,
              avatarHash: true,
            },
          },
        },
      },
    },
  });

  accounts.sort((a, b) =>
    (b.user.defenseStats?.progress ?? 0) -
    (a.user.defenseStats?.progress ?? 0) ||

    (b.user.stats?.wins ?? 0) -
    (a.user.stats?.wins ?? 0) ||

    (a.user.stats?.losses ?? 0) -
    (b.user.stats?.losses ?? 0) ||

    a.linkedAt.getTime() -
    b.linkedAt.getTime() ||

    a.puuid.localeCompare(b.puuid)
  );

  return accounts.slice(0, 9).map((account, index) => {
    const progress = Math.max(
      0,
      Math.floor(
        account.user.defenseStats?.progress ?? 0
      )
    );

    const tier = RANKS[
      Math.min(6, Math.floor(progress / 20))
    ];

    const discord =
      account.user.discordAccount;

    const avatar = discord
      ? getDiscordAvatarUrl(discord)
      : null;

    return {
      puuid: account.puuid,
      rank: index + 1,
      gameName: account.gameName,
      tagLine: account.tagLine,
      tier,

      avatarUrl: avatar
        ? avatar.replace("?size=128", "?size=512")
        : DEFAULT_AVATAR,
    };
  });
}
