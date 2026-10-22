"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useScrims } from "@/app/hooks/useScrims";

const filters = [
  ["ALL", "전체"], ["OPEN", "모집 중"], ["CLOSED", "마감"],
  ["TEAM_SELECTION", "팀 배정"], ["IN_PROGRESS", "경기 중"],
  ["FINISHED", "종료"], ["CANCELLED", "취소"],
] as const;
const statusNames: Record<string, string> = Object.fromEntries(filters);
function fmt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ko-KR", {timeZone:"Asia/Seoul", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"});
}

export default function AdminScrimsPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const { items, loading, error, refresh } = useScrims({
    limit: 200, intervalMs: 10000, history: true,
  });
  const visible = useMemo(() => items.filter(scrim =>
    (filter === "ALL" || scrim.status === filter) &&
    scrim.code.toUpperCase().includes(search.trim().toUpperCase())
  ), [items, filter, search]);
  const live = items.filter(s => ["OPEN", "CLOSED", "TEAM_SELECTION", "IN_PROGRESS"].includes(s.status));

  return <div className="ng-scrim-list ng-admin-dashboard">
    <header className="ng-admin-head">
      <div><div className="ng-admin-eyebrow">MATCH OPERATIONS</div>
        <h1>내전 관리</h1>
        <p>모집 상태부터 팀 구성과 경기 정산까지 관리합니다. 종료 기록은 보관됩니다.</p>
      </div>
      <div className="ng-scrim-headactions">
        <Link className="ng-scrim-muted-btn" href="/admin?tab=scrims">운영 현황</Link>
        <button className="ng-admin-primary" type="button" onClick={() => void refresh()}>새로고침</button>
      </div>
    </header>
    <div className="ng-scrim-stats">
      <div><span>조회된 내전</span><strong>{items.length}</strong></div>
      <div><span>모집 중</span><strong>{items.filter(s => s.status === "OPEN").length}</strong></div>
      <div><span>진행·준비</span><strong>{live.filter(s => s.status !== "OPEN").length}</strong></div>
      <div><span>종료</span><strong>{items.filter(s => s.status === "FINISHED").length}</strong></div>
    </div>
    <section className="ng-admin-panel">
      <div className="ng-scrim-toolbar">
        <div className="ng-scrim-filter" aria-label="내전 상태 필터">
          {filters.map(([id, text]) => <button key={id} type="button" className={filter===id?"active":""} onClick={() => setFilter(id)}>{text}</button>)}
        </div>
        <input aria-label="내전 코드 검색" placeholder="내전 코드 검색 (예: R006)" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {error && <p className="ng-scrim-error" role="alert">목록 조회 실패: {error}</p>}
      <div className="ng-admin-scroll"><table className="ng-admin-table ng-scrim-table">
        <thead><tr><th>내전 코드</th><th>종류</th><th>상태</th><th>참가자</th><th>시작 시각</th><th>생성 시각</th><th>관리</th></tr></thead>
        <tbody>
          {visible.map(scrim => <tr key={scrim.id}>
            <td><b>{scrim.code}</b></td>
            <td>{scrim.type === "RANKED" ? "랭크 내전" : "일반 내전"}</td>
            <td><span className={`ng-scrim-status st-${scrim.status.toLowerCase()}`}>{statusNames[scrim.status] || scrim.status}</span></td>
            <td>{scrim.participantCount}/{scrim.maxPlayers}{scrim.waitingCount ? ` (+${scrim.waitingCount})` : ""}</td>
            <td>{fmt(scrim.startAt)}</td><td>{fmt(scrim.createdAt)}</td>
            <td className="ng-admin-actions"><Link href={`/admin/scrims/${encodeURIComponent(scrim.code)}`}>관리 열기 ↗</Link></td>
          </tr>)}
          {!loading && !visible.length && <tr><td colSpan={7} className="ng-admin-empty">조건에 해당하는 내전이 없습니다.</td></tr>}
          {loading && <tr><td colSpan={7} className="ng-admin-empty">내전 목록을 불러오고 있습니다...</td></tr>}
        </tbody>
      </table></div>
      <div className="ng-scrim-footer">최근 최대 200건 표시 · 공개 사이트의 5시간 일반내전 노출 제한과 관계없이 운영 기록은 보관합니다.</div>
    </section>
  </div>;
}
