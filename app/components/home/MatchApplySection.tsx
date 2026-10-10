"use client";

import Link from "next/link";

import { useScrims } from "../../hooks/useScrims";
import type {
  PublicScrim,
  PublicScrimParticipant,
} from "../../lib/scrims/types";

function PeopleIcon() {
  return (
    <svg
      className="people-icon"
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="6" r="4" fill="currentColor" />
      <path
        d="M3 17c0-3.4 2.9-5.5 7-5.5s7 2.1 7 5.5"
        fill="currentColor"
      />
    </svg>
  );
}

const TIER_VALUE: Record<string, number> = {
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

const TIER_SHORT: Record<string, string> = {
  IRON: "I",
  BRONZE: "B",
  SILVER: "S",
  GOLD: "G",
  PLATINUM: "P",
  EMERALD: "E",
  DIAMOND: "D",
  MASTER: "M",
  GRANDMASTER: "GM",
  CHALLENGER: "C",
};

const DIVISION_VALUE: Record<string, number> = {
  IV: 0,
  III: 0.25,
  II: 0.5,
  I: 0.75,
};

function ruleLabel(rule: string) {
  const map: Record<string, string> = {
    HARD_FEARLESS: "하드 피어리스",
    SOFT_FEARLESS: "소프트 피어리스",
    NO_BAN: "노밴",
    BAN_FEARLESS: "밴 피어리스",
  };

  return map[rule] ?? rule;
}

function startLabel(scrim: PublicScrim) {
  if (scrim.type === "NORMAL") {
    return "10명 모집 완료 시 시작";
  }

  const date = new Date(scrim.startAt);

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function playerTierValue(
  player: PublicScrimParticipant,
) {
  const tier =
    player.currentTier?.toUpperCase();

  if (!tier) return null;

  return (
    (TIER_VALUE[tier] ?? 0) +
    (DIVISION_VALUE[
      player.currentRank?.toUpperCase() ?? ""
    ] ?? 0)
  );
}

function tierLabelFromValue(value: number | null) {
  if (value === null || value <= 0) {
    return "-";
  }

  const rounded =
    Math.min(
      10,
      Math.max(1, Math.round(value)),
    );

  const tier = Object.keys(TIER_VALUE).find(
    (key) => TIER_VALUE[key] === rounded,
  );

  return tier
    ? TIER_SHORT[tier] ?? tier
    : "-";
}

function rankedTierSummary(scrim: PublicScrim) {
  const values =
    (scrim.participants ?? [])
      .filter((p) => p.status === "CONFIRMED")
      .map(playerTierValue)
      .filter(
        (value): value is number =>
          value !== null,
      );

  if (!values.length) {
    return {
      avgTier: "-",
      maxTier: "-",
    };
  }

  const avg =
    values.reduce((a, b) => a + b, 0) /
    values.length;

  return {
    avgTier:
      tierLabelFromValue(avg),
    maxTier:
      tierLabelFromValue(
        Math.max(...values),
      ),
  };
}

function MatchRow({
  scrim,
  ranked = false,
}: {
  scrim: PublicScrim;
  ranked?: boolean;
}) {
  const isOpen =
    scrim.status === "OPEN";

  const tiers =
    ranked
      ? rankedTierSummary(scrim)
      : null;

  return (
    <div
      className={`match-row ${
        ranked ? "ranked-row" : ""
      } ${
        isOpen
          ? "is-open"
          : "is-closed"
      }`}
    >
      <div className="match-left-line" />

      <div className="match-time">
        {startLabel(scrim)}
      </div>

      <div className="match-people">
        <PeopleIcon />
        <span>
          ({scrim.participantCount}/{scrim.maxPlayers})
        </span>
      </div>

      {ranked && tiers && (
        <>
          <div className="match-tier-block">
            <span className="tier-label">
              평균 티어
            </span>
            <span className="tier-avg">
              {tiers.avgTier}
            </span>
          </div>

          <div className="match-tier-block">
            <span className="tier-label">
              최상위 티어
            </span>
            <span className="tier-max">
              {tiers.maxTier}
            </span>
          </div>
        </>
      )}

      <div className="match-map">
        {ruleLabel(scrim.rule)}
      </div>

      <div
        className={`match-status ${
          isOpen
            ? "status-open"
            : "status-closed"
        }`}
      >
        {isOpen ? "모집중" : "마감"}
      </div>

      <Link
        className={`match-action ${
          isOpen
            ? "action-open"
            : "action-closed"
        }`}
        href={
          scrim.forumThreadId
            ? `https://discord.com/channels/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}/${scrim.forumThreadId}`
            : `/matches/result?code=${encodeURIComponent(scrim.code)}`
        }
        target={scrim.forumThreadId ? "_blank" : undefined}
        rel={scrim.forumThreadId ? "noreferrer" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isOpen ? "참여 보기" : "내전 보기"}
      </Link>
    </div>
  );
}

export default function MatchApplySection() {
  const {
    items,
    loading,
    error,
  } = useScrims({
    active: true,
    limit: 30,
    intervalMs: 5000,
    participants: true,
  });

  const normalMatches =
    items
      .filter((item) => item.type === "NORMAL")
      .slice(0, 4);

  const rankedMatches =
    items
      .filter((item) => item.type === "RANKED")
      .slice(0, 4);

  return (
    <section className="match-section">
      <div className="match-grid">
        <div className="match-board">
          <h2 className="section-title">
            일반 내전 신청
          </h2>

          <div className="match-list">
            {loading && (
              <div className="match-row">
                <div className="match-time">
                  내전 목록을 불러오는 중입니다.
                </div>
              </div>
            )}

            {!loading &&
              normalMatches.map((scrim) => (
                <MatchRow
                  key={scrim.id}
                  scrim={scrim}
                />
              ))}

            {!loading &&
              !error &&
              normalMatches.length === 0 && (
                <div className="match-row">
                  <div className="match-time">
                    현재 진행 중인 일반 내전이 없습니다.
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="match-board">
          <h2 className="section-title">
            랭크 내전 신청
          </h2>

          <div className="match-list">
            {loading && (
              <div className="match-row ranked-row">
                <div className="match-time">
                  내전 목록을 불러오는 중입니다.
                </div>
              </div>
            )}

            {!loading &&
              rankedMatches.map((scrim) => (
                <MatchRow
                  key={scrim.id}
                  scrim={scrim}
                  ranked
                />
              ))}

            {!loading &&
              !error &&
              rankedMatches.length === 0 && (
                <div className="match-row ranked-row">
                  <div className="match-time">
                    현재 진행 중인 랭크 내전이 없습니다.
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </section>
  );
}
