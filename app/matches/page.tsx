"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

import MatchSearchHero from
  "../components/matches/MatchSearchHero";

import MatchBoardSection from
  "../components/matches/MatchBoardSection";

import MatchRuleGuide from
  "../components/matches/MatchRuleGuide";

import { useScrims } from "../hooks/useScrims";
import type {
  PublicScrim,
  PublicScrimParticipant,
} from "../lib/scrims/types";

import "./matches.css";

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

function ruleLabel(rule: string) {
  const map: Record<string, string> = {
    HARD_FEARLESS: "하드 피어리스",
    SOFT_FEARLESS: "소프트 피어리스",
    NO_BAN: "노밴",
    BAN_FEARLESS: "밴 피어리스",
  };

  return map[rule] ?? rule;
}

function timeLabel(scrim: PublicScrim) {
  if (scrim.type === "NORMAL") {
    return "10명 모집 완료 시 시작";
  }

  const date = new Date(scrim.startAt);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

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

function tierValue(
  player: PublicScrimParticipant,
) {
  const tier =
    player.currentTier?.toUpperCase();

  if (!tier) return null;

  return TIER_VALUE[tier] ?? null;
}

function tierLabel(value: number | null) {
  if (value === null) return "-";

  const rounded =
    Math.min(
      10,
      Math.max(1, Math.round(value)),
    );

  const tier =
    Object.keys(TIER_VALUE).find(
      (key) =>
        TIER_VALUE[key] === rounded,
    );

  return tier
    ? TIER_SHORT[tier] ?? tier
    : "-";
}

function rankedSummary(scrim: PublicScrim) {
  const values =
    (scrim.participants ?? [])
      .filter(
        (player) =>
          player.status === "CONFIRMED",
      )
      .map(tierValue)
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

  return {
    avgTier: tierLabel(
      values.reduce(
        (a, b) => a + b,
        0,
      ) / values.length,
    ),
    maxTier: tierLabel(
      Math.max(...values),
    ),
  };
}

export default function MatchesPage() {
  const {
    items,
    loading,
    error,
  } = useScrims({
    active: true,
    limit: 100,
    intervalMs: 5000,
    participants: true,
  });

  const normalMatches =
    items
      .filter(
        (scrim) =>
          scrim.type === "NORMAL",
      )
      .map((scrim) => ({
        code: scrim.code,
        time: timeLabel(scrim),
        people:
          `${scrim.participantCount} / ${scrim.maxPlayers}`,
        map: ruleLabel(scrim.rule),
        forumThreadId: scrim.forumThreadId ?? null,
        status:
          scrim.status === "OPEN"
            ? ("open" as const)
            : ("closed" as const),
      }));

  const rankedMatches =
    items
      .filter(
        (scrim) =>
          scrim.type === "RANKED",
      )
      .map((scrim) => {
        const tiers =
          rankedSummary(scrim);

        return {
          code: scrim.code,
          time: timeLabel(scrim),
          people:
            `${scrim.participantCount} / ${scrim.maxPlayers}`,
          avgTier: tiers.avgTier,
          maxTier: tiers.maxTier,
          map: ruleLabel(scrim.rule),
          forumThreadId: scrim.forumThreadId ?? null,
          status:
            scrim.status === "OPEN"
              ? ("open" as const)
              : ("closed" as const),
        };
      });

  return (
    <main className="matches-page">
      <Header active="matches" />

      <MatchSearchHero />

      <div className="matches-content">
        <div className="matches-content-inner">
          {loading && (
            <div
              style={{
                padding: "20px 0",
                color:
                  "rgba(255,255,255,.5)",
              }}
            >
              내전 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "20px 0",
                color: "#ff8c8c",
              }}
            >
              내전 목록을 불러오지 못했습니다.
            </div>
          )}

          {!loading && !error && (
            <>
              <MatchBoardSection
                type="ranked"
                title="랭크 내전"
                description="내전.GG 랭크가 적용되는 경쟁형 내전입니다."
                matches={rankedMatches}
              />

              <MatchBoardSection
                type="normal"
                title="일반 내전"
                description="10명이 모이면 시작되는 일반 내전입니다."
                matches={normalMatches}
              />
            </>
          )}

          <MatchRuleGuide />
        </div>
      </div>

      <Footer />
    </main>
  );
}
