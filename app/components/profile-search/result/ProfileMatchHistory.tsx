"use client";

import {
  useState,
} from "react";

import type {
  MatchHistoryItem,
  MatchTeamPlayer,
} from "../../../data/profile";


type Props = {
  matches: MatchHistoryItem[];
  puuid: string;
};


type DetailTab =
  | "summary"
  | "score"
  | "team"
  | "build"
  | "etc";


function PlayerMiniList({
  players,
}: {
  players:
    MatchHistoryItem["allies"];
}) {
  return (
    <div className="match-mini-player-list">

      {players.map(
        (player) => (
          <div
            key={
              player.name
            }
            className={
              `match-mini-player ${
                player.isMe
                  ? "is-me"
                  : ""
              }`
            }
          >

            <div className="match-mini-champion-image">
              <img
                src={
                  player.championImage
                }
                alt=""
              />
            </div>

            <span>
              {
                player.name
              }
            </span>

          </div>
        )
      )}

    </div>
  );
}


function DetailTeamRow({
  player,
}: {
  player:
    MatchTeamPlayer;
}) {
  return (
    <div className="match-detail-player-row">

      <div className="match-detail-user">

        <div className="match-detail-champion-image">
          <img
            src={
              player.championImage
            }
            alt=""
          />
        </div>


        <div className="match-detail-user-text">

          <strong>
            {
              player.name
            }
          </strong>

          <span>
            Lv.
            {
              player.level
            }
          </span>

        </div>

      </div>


      <div className="match-detail-kda">

        <strong>
          {
            player.kills
          }
          /
          {
            player.deaths
          }
          /
          {
            player.assists
          }
        </strong>

        <span>
          {(
            (
              player.kills +
              player.assists
            ) /
            Math.max(
              player.deaths,
              1
            )
          ).toFixed(2)}
          :1
        </span>

      </div>


      <div className="match-detail-number">
        {
          player.damage < 0 ? "-" : player.damage.toLocaleString()
        }
      </div>


      <div className="match-detail-number">
        {
          player.wards
        }
      </div>


      <div className="match-detail-number">
        {
          player.cs
        }
      </div>


      <div className="match-detail-items">

        {player.items.map(
          (image, index) => (
            <img
              key={index}
              src={image}
              alt=""
            />
          )
        )}

      </div>

    </div>
  );
}


function MatchDetail({
  match,
}: {
  match:
    MatchHistoryItem;
}) {
  const [
    tab,
    setTab,
  ] = useState<DetailTab>(
    "team"
  );


  return (
    <div className="match-detail-panel">

      <div className="match-detail-tabs">

        <button
          type="button"
          className={
            tab === "team"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("team")
          }
        >
          팀 분석
        </button>


        <button
          type="button"
          className={
            tab === "build"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("build")
          }
        >
          빌드
        </button>


        <button
          type="button"
          className={
            tab === "etc"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("etc")
          }
        >
          기타
        </button>

      </div>


      {tab === "team" && (
        <div className="match-detail-summary">

          <div className="match-detail-header-row">

            <span>
              소환사
            </span>

            

            <span>
              KDA
            </span>

            <span>
              피해량
            </span>

            <span>
              와드
            </span>

            <span>
              CS
            </span>

            <span>
              아이템
            </span>

          </div>


          <div className="match-detail-team-heading blue">

            <strong>
              승리
            </strong>

            <div>
              <span>
                총 킬
              </span>

              <b>
                {
                  match.detail.blueKills
                }
              </b>
            </div>

            <div>
              <span>
                총 골드
              </span>

              <b>
                {
                  match.queue === "내전" ? "-" : match.detail.blueGold.toLocaleString()
                }
              </b>
            </div>

          </div>


          {match.detail.blueTeam.map(
            (player) => (
              <DetailTeamRow
                key={
                  player.name
                }
                player={
                  player
                }
              />
            )
          )}


          <div className="match-detail-team-heading red">

            <strong>
              패배
            </strong>

            <div>
              <span>
                총 킬
              </span>

              <b>
                {
                  match.detail.redKills
                }
              </b>
            </div>

            <div>
              <span>
                총 골드
              </span>

              <b>
                {
                  match.queue === "내전" ? "-" : match.detail.redGold.toLocaleString()
                }
              </b>
            </div>

          </div>


          {match.detail.redTeam.map(
            (player) => (
              <DetailTeamRow
                key={
                  player.name
                }
                player={
                  player
                }
              />
            )
          )}

        </div>
      )}




    </div>
  );
}


function MatchCard({
  match,
  defaultOpen,
}: {
  match:
    MatchHistoryItem;

  defaultOpen:
    boolean;
}) {
  const [
    open,
    setOpen,
  ] = useState(
    defaultOpen
  );


  return (
    <article
      className={
        `profile-match-wrap ${
          match.result === "win"
            ? "is-win"
            : "is-lose"
        }`
      }
    >

      <div className="profile-match-card">


        <div className="profile-match-result">

          <strong>
            {
              match.queue
            }
          </strong>

          <span>
            {
              match.ago
            }
          </span>

          <b>
            {
              match.result ===
              "win"
                ? "승리"
                : "패배"
            }
          </b>

          <span>
            {
              match.duration
            }
          </span>

        </div>


        <div className="profile-match-champion-area">

          <div className="profile-match-champion">

            <div className="profile-match-champion-image">
              <img
                src={
                  match.championImage
                }
                alt={
                  match.champion
                }
              />
            </div>

            <span>
              {
                match.championLevel
              }
            </span>

          </div>


          <div className="profile-match-spells">

            {match.spells.map(
              (image) => (
                <img
                  key={image}
                  src={image}
                  alt=""
                />
              )
            )}

          </div>


          <div className="profile-match-runes">

            {match.runes.map(
              (image) => (
                <img
                  key={image}
                  src={image}
                  alt=""
                />
              )
            )}

          </div>

        </div>


        <div className="profile-match-main">

          <div className="profile-match-kda">

            <strong>
              {
                match.kills
              }
              {" / "}
              {
                match.deaths
              }
              {" / "}
              {
                match.assists
              }
            </strong>

            <span>
              {
                match.rating
              } 평점
            </span>

          </div>


          <div className="profile-match-stats">

            <span>
              {match.queue === "내전" ? "라인전 미수집" : `라인전 ${match.laneScore}:${100 - match.laneScore}`}
            </span>

            <span>
              킬관여{" "}
              {
                match.killParticipation
              }%
            </span>

            <span>
              CS{" "}
              {
                match.cs
              } (
              {
                match.csPerMinute
              }
              )
            </span>

          </div>


          <div className="profile-match-items">

            {match.items.map(
              (
                image,
                index
              ) => (
                <img
                  key={index}
                  src={image}
                  alt=""
                />
              )
            )}

            <img
              src={
                match.trinket
              }
              alt=""
            />

          </div>

        </div>


        <div className="profile-match-players">

          <PlayerMiniList
            players={
              match.allies
            }
          />

          <PlayerMiniList
            players={
              match.enemies
            }
          />

        </div>


        <button
          type="button"
          className="profile-match-toggle"
          onClick={() =>
            setOpen(
              (value) =>
                !value
            )
          }
        >
          {
            open
              ? "⌃"
              : "⌄"
          }
        </button>

      </div>


      {open && (
        <MatchDetail
          match={
            match
          }
        />
      )}

    </article>
  );
}



/* R-series BO3: group finished set-level tracker records by scrim code. */
type HistoryEntry =
  | { kind: "match"; match: MatchHistoryItem }
  | { kind: "series"; code: string; sets: MatchHistoryItem[] };

function getScrimSet(match: MatchHistoryItem): { code: string; set: number } | null {
  if (match.queue !== "내전") return null;
  const found = /^\s*(R\d+)\s+([1-3])세트(?:\s*[·・•]\s*.*)?\s*$/.exec(match.ago);
  if (!found) return null;
  return { code: found[1], set: Number(found[2]) };
}

function groupScrimSeries(matches: MatchHistoryItem[]): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const groups = new Map<string, Extract<HistoryEntry, { kind: "series" }>>();
  for (const match of matches) {
    const tag = getScrimSet(match);
    if (!tag) { entries.push({ kind: "match", match }); continue; }
    let group = groups.get(tag.code);
    if (!group) {
      group = { kind: "series", code: tag.code, sets: [] };
      groups.set(tag.code, group);
      entries.push(group);
    }
    if (!group.sets.some((prev) => getScrimSet(prev)?.set === tag.set)) group.sets.push(match);
  }
  for (const group of groups.values()) {
    group.sets.sort((a,b) => (getScrimSet(a)?.set ?? 0) - (getScrimSet(b)?.set ?? 0));
  }
  return entries;
}

function RankedSeriesCard({ code, sets }: { code: string; sets: MatchHistoryItem[] }) {
  const [open, setOpen] = useState(false);
  const wins = sets.filter((set) => set.result === "win").length;
  const losses = sets.filter((set) => set.result === "lose").length;
  // A missing tracker set must not be fabricated as a match win/loss.
  const outcome = wins >= 2 ? "win" : losses >= 2 ? "lose" : "partial";
  const score = outcome === "partial"
    ? `${wins}승 ${losses}패 · 기록 일부`
    : `${wins}:${losses} ${outcome === "win" ? "승리" : "패배"}`;
  const timeText = sets[sets.length - 1]?.ago.replace(/^\s*R\d+\s+[1-3]세트\s*[·・•]?\s*/, "") ?? "";
  return (
    <article className={`profile-scrim-series series-${outcome}`}>
      <button type="button" className="profile-scrim-series-button"
        onClick={() => setOpen((v) => !v)} aria-expanded={open}
        aria-controls={`profile-bo3-${code}`}>
        <span className="profile-scrim-series-folder" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3V7Z" />
            <path d="M3 10h18" />
          </svg>
        </span>
        <span className="profile-scrim-series-title">
          <strong>{code}</strong>
          <small>랭크 내전 · 3판 2선승{timeText ? ` · ${timeText}` : ""}</small>
        </span>
        <span className="profile-scrim-series-score">
          <b>{score}</b>
          <small>{sets.length}세트 기록</small>
        </span>
        <span className={`profile-scrim-series-arrow ${open ? "is-open" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      {open && (
        <div id={`profile-bo3-${code}`} className="profile-scrim-series-sets">
          {sets.map((match) => {
            const setNumber = getScrimSet(match)?.set;
            return (
              <div className="profile-scrim-set" key={`${code}-${setNumber ?? match.id}`}>
                <div className="profile-scrim-set-label">
                  <strong>{setNumber ? `${setNumber}세트` : "세트 기록"}</strong>
                  <span className={match.result === "win" ? "set-win" : "set-lose"}>
                    {match.result === "win" ? "승리" : "패배"}
                  </span>
                </div>
                <MatchCard match={match} defaultOpen={false} />
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function ProfileMatchHistory({
  matches,
  puuid,
}: Props) {

  const [
    tab,
    setTab,
  ] = useState<
    "all" |
    "scrim" |
    "solo" |
    "flex"
  >("all");


  const [
    visibleCount,
    setVisibleCount,
  ] = useState(20);

  const [loadedMatches, setLoadedMatches] = useState(matches);
  const [nextStart, setNextStart] = useState(40);
  const [canFetchMore, setCanFetchMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadMore = async () => {
    if (loading) return;

    if (visibleCount < filteredMatches.length) {
      setVisibleCount((n) => n + 20);
      return;
    }

    if (!canFetchMore) return;

    setLoading(true);
    setLoadError(false);

    try {
      const query = new URLSearchParams({
        puuid,
        start: String(nextStart),
      });

      const response = await fetch(
        `/api/profile-matches?${query}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("전적 조회 실패");
      }

      const result: {
        matches: MatchHistoryItem[];
        nextStart: number;
        hasMore: boolean;
      } = await response.json();

      setLoadedMatches((before) => {
        const known = new Set(
          before.map((m) => m.matchId).filter(Boolean)
        );

        const extra = result.matches.filter(
          (m) => !m.matchId || !known.has(m.matchId)
        );

        return [...before, ...extra].sort(
          (a, b) =>
            (b.gameCreation ?? 0) -
            (a.gameCreation ?? 0)
        );
      });

      setNextStart(result.nextStart);
      setCanFetchMore(result.hasMore);
      setVisibleCount((n) => n + 20);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };


  const changeTab = (
    value:
      "all" |
      "scrim" |
      "solo" |
      "flex"
  ) => {
    setTab(value);
    setVisibleCount(20);
  };


  const filteredMatches =
    loadedMatches.filter(
      (match) => {

        if (
          tab === "solo"
        ) {
          return (
            match.queueId ===
            420
          );
        }


        if (
          tab === "flex"
        ) {
          return (
            match.queueId ===
            440
          );
        }


        if (
          tab === "scrim"
        ) {
          return (
            match.queue ===
            "내전"
          );
        }


        return true;
      },
    );


  // BO3 occupies one row in the list; keep Riot history pagination intact.
  const historyEntries = groupScrimSeries(filteredMatches);
  const visibleMatches = historyEntries.slice(0, visibleCount);
  const hasMore = visibleCount < historyEntries.length || canFetchMore;


  return (
    <section className="profile-result-history">

      <div className="profile-result-tabs">

        <button
          type="button"
          className={
            tab === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("all")
          }
        >
          전체 전적
        </button>


        <button
          type="button"
          className={
            tab === "scrim"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("scrim")
          }
        >
          내전 전적
        </button>


        <button
          type="button"
          className={
            tab === "solo"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("solo")
          }
        >
          솔로랭크
        </button>


        <button
          type="button"
          className={
            tab === "flex"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("flex")
          }
        >
          자유랭크
        </button>

      </div>


      <div className="profile-match-list">

        {visibleMatches.length === 0 && (
          <div className="profile-match-empty">
            표시할 전적이 없습니다.
          </div>
        )}


                {visibleMatches.map((entry, index) =>
          entry.kind === "series" ? (
            <RankedSeriesCard key={`series-${entry.code}`} code={entry.code} sets={entry.sets} />
          ) : (
            <MatchCard key={`${entry.match.id}-${index}`} match={entry.match} defaultOpen={false} />
          )
        )}


{hasMore && (
          <button
            type="button"
            className="profile-match-more"
            disabled={loading}
            onClick={loadMore}
          >
            {loading
              ? "불러오는 중..."
              : loadError
                ? "다시 시도"
                : "전적 더보기"}
          </button>
        )}

      </div>

    </section>
  );
}
