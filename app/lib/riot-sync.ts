import { prisma } from "./prisma";

import {
  getRiotProfileSnapshot,
  getRecentMatchIds,
  getMatchById,
  type RiotMatchDto,
} from "./riot";


const RECENT_MATCH_IDS = 40;
const CONCURRENCY = 2;

const SUPPORTED_QUEUE_IDS =
  new Set([
    400,
    420,
    430,
    440,
    490,
  ]);


function isSupportedMatch(
  match: RiotMatchDto,
) {
  return (
    SUPPORTED_QUEUE_IDS.has(
      match.info.queueId,
    ) &&
    match.info.participants.length ===
      10
  );
}


async function fetchInChunks(
  ids: string[],
) {
  const results:
    RiotMatchDto[] = [];

  for (
    let i = 0;
    i < ids.length;
    i += CONCURRENCY
  ) {
    const chunk =
      ids.slice(
        i,
        i + CONCURRENCY,
      );

    const settled =
      await Promise.allSettled(
        chunk.map(
          (id) =>
            getMatchById(id)
        )
      );

    for (
      let j = 0;
      j < settled.length;
      j++
    ) {
      const result =
        settled[j];

      if (
        result.status ===
        "fulfilled"
      ) {
        results.push(
          result.value
        );
      } else {
        console.error(
          "[RIOT MATCH FETCH FAILED]",
          chunk[j],
          result.reason,
        );
      }
    }
  }

  return results;
}


export async function syncRiotAccountByUserId(
  userId: string,
) {
  const account =
    await prisma.riotAccount.findUnique({
      where: {
        userId,
      },
    });

  if (!account) {
    return {
      ok: false,
      reason:
        "RIOT_ACCOUNT_NOT_FOUND",
    };
  }


  /*
    시즌 전체 조회 X

    현재 Riot 정보 +
    최근 Match ID 40개만 확인한다.
  */
  const [
    snapshot,
    recentIds,
  ] =
    await Promise.all([
      getRiotProfileSnapshot(
        account.puuid,
      ),

      getRecentMatchIds(
        account.puuid,
        RECENT_MATCH_IDS,
        0,
      ),
    ]);


  /*
    이미 저장된 최근 경기 확인
  */
  const cached =
    recentIds.length
      ? await prisma.riotMatchCache.findMany({
          where: {
            puuid:
              account.puuid,

            id: {
              in:
                recentIds,
            },
          },

          select: {
            id: true,
          },
        })
      : [];


  const cachedIds =
    new Set(
      cached.map(
        (row) =>
          row.id
      )
    );


  /*
    최근 40개 중 없는 경기만 호출.
    이미 갱신한 유저는 보통 몇 경기만 호출됨.
  */
  const missingIds =
    recentIds.filter(
      (id) =>
        !cachedIds.has(id)
    );


  console.log(
    `[RIOT RECENT SYNC] ${account.gameName}#${account.tagLine}`,
    {
      checked:
        recentIds.length,

      cached:
        cachedIds.size,

      missing:
        missingIds.length,
    },
  );


  const fetched =
    await fetchInChunks(
      missingIds
    );


  let saved = 0;


  for (
    const match of fetched
  ) {
    if (
      !isSupportedMatch(
        match
      )
    ) {
      continue;
    }

    await prisma.riotMatchCache.upsert({
      where: {
        id:
          match.metadata.matchId,
      },

      create: {
        id:
          match.metadata.matchId,

        puuid:
          account.puuid,

        queueId:
          match.info.queueId,

        gameCreation:
          BigInt(
            match.info.gameCreation
          ),

        gameDuration:
          match.info.gameDuration,

        data:
          match as any,
      },

      update: {
        puuid:
          account.puuid,

        queueId:
          match.info.queueId,

        gameCreation:
          BigInt(
            match.info.gameCreation
          ),

        gameDuration:
          match.info.gameDuration,

        data:
          match as any,
      },
    });

    saved += 1;
  }


  await prisma.riotAccount.update({
    where: {
      userId,
    },

    data: {
      summonerLevel:
        snapshot.level,

      profileIconId:
        snapshot.profileIconId,

      soloTier:
        snapshot.solo?.tier ??
        null,

      soloRank:
        snapshot.solo?.rank ??
        null,

      soloLp:
        snapshot.solo?.lp ??
        null,

      soloWins:
        snapshot.solo?.wins ??
        null,

      soloLosses:
        snapshot.solo?.losses ??
        null,

      flexTier:
        snapshot.flex?.tier ??
        null,

      flexRank:
        snapshot.flex?.rank ??
        null,

      flexLp:
        snapshot.flex?.lp ??
        null,

      flexWins:
        snapshot.flex?.wins ??
        null,

      flexLosses:
        snapshot.flex?.losses ??
        null,

      lastSyncedAt:
        new Date(),
    },
  });


  return {
    ok: true,

    riotId:
      `${account.gameName}#${account.tagLine}`,

    checked:
      recentIds.length,

    cached:
      cachedIds.size,

    fetched:
      fetched.length,

    saved,
  };
}
