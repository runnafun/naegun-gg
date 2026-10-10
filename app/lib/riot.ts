type RiotSummoner = {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
};

type RiotLeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type RiotMatchParticipant = {
  puuid: string;

  riotIdGameName?: string;
  riotIdTagline?: string;

  championName: string;
  champLevel: number;

  kills: number;
  deaths: number;
  assists: number;

  totalDamageDealtToChampions: number;

  totalMinionsKilled: number;
  neutralMinionsKilled: number;

  goldEarned: number;

  wardsPlaced: number;
  wardsKilled: number;

  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;

  summoner1Id: number;
  summoner2Id: number;

  win: boolean;
  teamId: number;
};

export type RiotMatchDto = {
  metadata: {
    matchId: string;
    participants: string[];
  };

  info: {
    gameCreation: number;
    gameDuration: number;
    queueId: number;

    participants:
      RiotMatchParticipant[];
  };
};

export type RiotProfileSnapshot = {
  level: number;
  profileIconId: number;

  solo: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
  } | null;

  flex: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
  } | null;
};


function apiKey() {
  const value =
    process.env.RIOT_API_KEY;

  if (!value) {
    throw new Error(
      "RIOT_API_KEY가 없습니다."
    );
  }

  return value;
}


async function riotFetch<T>(
  url: string,
): Promise<T> {
  const maxAttempts = 8;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const response =
      await fetch(
        url,
        {
          headers: {
            "X-Riot-Token":
              apiKey(),
          },

          cache:
            "no-store",
        },
      );

    if (response.ok) {
      return await response.json() as T;
    }

    if (
      response.status === 429 &&
      attempt < maxAttempts
    ) {
      const retryAfter =
        Number(
          response.headers.get(
            "retry-after"
          ) ?? "2"
        );

      const waitMs =
        Math.max(
          retryAfter * 1000,
          1500,
        );

      console.warn(
        `[RIOT 429] ${waitMs}ms 대기 후 재시도 ${attempt}/${maxAttempts}`
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            waitMs,
          )
      );

      continue;
    }

    const text =
      await response.text();

    throw new Error(
      `Riot API ${response.status}: ${text.slice(0, 250)}`
    );
  }

  throw new Error(
    "Riot API 재시도 횟수 초과"
  );
}


export async function getRiotProfileSnapshot(
  puuid: string,
): Promise<RiotProfileSnapshot> {
  const encoded =
    encodeURIComponent(
      puuid,
    );

  const summoner =
    await riotFetch<RiotSummoner>(
      `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encoded}`
    );

  let entries:
    RiotLeagueEntry[] = [];

  try {
    entries =
      await riotFetch<RiotLeagueEntry[]>(
        `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${encoded}`
      );
  } catch (error) {
    console.error(
      "[RIOT LEAGUE]",
      error,
    );
  }

  const solo =
    entries.find(
      (entry) =>
        entry.queueType ===
        "RANKED_SOLO_5x5",
    ) ?? null;

  const flex =
    entries.find(
      (entry) =>
        entry.queueType ===
        "RANKED_FLEX_SR",
    ) ?? null;

  return {
    level:
      summoner.summonerLevel ?? 0,

    profileIconId:
      summoner.profileIconId ?? 29,

    solo:
      solo
        ? {
            tier: solo.tier,
            rank: solo.rank,
            lp: solo.leaguePoints,
            wins: solo.wins,
            losses: solo.losses,
          }
        : null,

    flex:
      flex
        ? {
            tier: flex.tier,
            rank: flex.rank,
            lp: flex.leaguePoints,
            wins: flex.wins,
            losses: flex.losses,
          }
        : null,
  };
}


export async function getRecentMatchIds(
  puuid: string,
  count = 20,
  start = 0,
  options?: {
    queue?: number;
    startTime?: number;
  },
) {
  const encoded =
    encodeURIComponent(
      puuid,
    );

  const params =
    new URLSearchParams();

  params.set(
    "start",
    String(
      Math.max(
        start,
        0,
      )
    ),
  );

  params.set(
    "count",
    String(
      Math.min(
        Math.max(
          count,
          1,
        ),
        100,
      )
    ),
  );

  if (
    options?.queue !==
    undefined
  ) {
    params.set(
      "queue",
      String(
        options.queue
      ),
    );
  }

  if (
    options?.startTime !==
    undefined
  ) {
    params.set(
      "startTime",
      String(
        options.startTime
      ),
    );
  }

  return riotFetch<string[]>(
    `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${encoded}/ids?${params.toString()}`
  );
}


export async function getMatchById(
  matchId: string,
) {
  return riotFetch<RiotMatchDto>(
    `https://asia.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`
  );
}


export async function getRecentMatches(
  puuid: string,
  count = 15,
): Promise<RiotMatchDto[]> {
  const ids =
    await getRecentMatchIds(
      puuid,
      count,
    );

  const matches:
    RiotMatchDto[] = [];

  /*
    개발키 rate limit 때문에
    한꺼번에 15개 Promise.all 하지 않고
    순차 조회합니다.
  */
  for (const id of ids) {
    try {
      const match =
        await getMatchById(id);

      matches.push(match);

    } catch (error) {
      console.error(
        "[RIOT MATCH]",
        id,
        error,
      );
    }
  }

  return matches;
}
