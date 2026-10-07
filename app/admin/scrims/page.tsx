"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useScrims } from "@/app/hooks/useScrims";

export default function AdminScrimsPage() {
  const [filter, setFilter] =
    useState("ALL");

  const {
    items,
    loading,
    error,
    refresh,
  } = useScrims({
    limit: 200,
    intervalMs: 3000,
    participants: false,
  });

  const visible =
    useMemo(() => {
      if (filter === "ALL") {
        return items;
      }

      return items.filter(
        (item) =>
          item.status === filter,
      );
    }, [items, filter]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#070b09",
        color: "white",
        padding: "70px 24px",
      }}
    >
      <div
        style={{
          width: "min(1200px, 100%)",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div>
            <div
              style={{
                color:
                  "rgba(255,255,255,.4)",
                fontSize: 12,
              }}
            >
              내전.GG ADMIN
            </div>
            <h1>내전 관리</h1>
          </div>

          <button onClick={refresh}>
            새로고침
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          {[
            "ALL",
            "OPEN",
            "CLOSED",
            "TEAM_SELECTION",
            "IN_PROGRESS",
            "FINISHED",
            "CANCELLED",
          ].map((status) => (
            <button
              key={status}
              onClick={() =>
                setFilter(status)
              }
              style={{
                opacity:
                  filter === status
                    ? 1
                    : 0.5,
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {loading && (
          <p>불러오는 중...</p>
        )}

        {error && (
          <p
            style={{
              color: "#ff8c8c",
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          {visible.map(
            (scrim) => (
              <div
                key={scrim.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "110px 110px 130px 1fr 120px 160px",
                  gap: 12,
                  alignItems:
                    "center",
                  padding:
                    "14px 16px",
                  border:
                    "1px solid rgba(255,255,255,.07)",
                  borderRadius: 12,
                  background:
                    "rgba(255,255,255,.025)",
                }}
              >
                <strong>
                  {scrim.code}
                </strong>

                <span>
                  {scrim.type}
                </span>

                <span>
                  {scrim.status}
                </span>

                <span>
                  {scrim.participantCount}
                  /
                  {scrim.maxPlayers}
                  {scrim.waitingCount > 0
                    ? ` (+${scrim.waitingCount})`
                    : ""}
                </span>

                <Link
                  href={`/matches/result?code=${encodeURIComponent(scrim.code)}`}
                >
                  조회
                </Link>

                <Link
                  href={`/admin/scrims/${scrim.code}`}
                >
                  팀 배정 / 관리
                </Link>
              </div>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
