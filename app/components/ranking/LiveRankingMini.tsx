"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { className: string; riotId?: string };
type Summary = { rankDisplay: string; position: number; played: boolean };
export default function LiveRankingMini({ className, riotId }: Props) {
  const [label, setLabel] = useState("랭킹 불러오는 중");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const query = riotId ? `?riotId=${encodeURIComponent(riotId)}` : "";
        const response = await fetch(`/api/ranking/live${query}`, { cache: "no-store" });
        if (!response.ok) throw new Error("ranking unavailable");
        const data: { leader: { gameName: string } | null; me: Summary | null } = await response.json();
        if (!active) return;
        const value = riotId
          ? (data.me ? `${data.me.played ? `${data.me.position}위` : "미배치"} · ${data.me.rankDisplay}` : "랭킹 정보 없음")
          : (data.leader ? `1위 ${data.leader.gameName}` : "랭크전 기록 대기");
        setLabel(value);
      } catch { if (active) setLabel("랭킹 확인하기"); }
    }
    void load();
    const timer = setInterval(() => void load(), 60000);
    return () => { active = false; clearInterval(timer); };
  }, [riotId]);
  return (
    <Link href="/ranking" className={className} style={{ textDecoration: "none", color: "inherit" }} title="내전랭킹 보러가기">
      <strong>내전.GG 랭킹</strong><span>{label}</span>
    </Link>
  );
}
