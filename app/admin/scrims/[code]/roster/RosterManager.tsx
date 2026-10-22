"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Member = {
  discordUserId: string;
  name: string;
  status: string;
  rdsStatus: string | null;
  botStatus: string | null;
  removed: boolean;
};
type Candidate = { discordUserId: string; name: string; username: string; riotId: string };
type AddRequest = { discordUserId: string; status: string; error?: string };
type Roster = {
  ok: boolean;
  status: string;
  editable: boolean;
  confirmedRds: number;
  confirmedBot: number;
  snapshotAt: string | null;
  participants: Member[];
  addRequests?: AddRequest[];
  error?: string;
};

export default function RosterManager({ code }: { code: string }) {
  const [data, setData] = useState<Roster | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/roster`, { cache: "no-store" });
      const json: Roster = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? `HTTP ${response.status}`);
      setData(json);
      setMessage("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "불러오기 실패");
    } finally { setLoading(false); }
  }, [code]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function remove(member: Member) {
    if (busy || member.removed || !data?.editable) return;
    const ok = window.confirm(`${member.name} (${member.discordUserId})\n\n이 소환사를 ${code}에서 제외할까요?\n경기 참가 및 팀 배정 명단에서 제외되며 되돌리려면 별도 복구가 필요합니다.`);
    if (!ok) return;
    setBusy(member.discordUserId);
    try {
      const response = await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/roster`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordUserId: member.discordUserId }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? `HTTP ${response.status}`);
      await refresh();
      setMessage(`${member.name} 제외 요청 완료. 봇 모집글은 약 20~30초 후 갱신됩니다.`);
    } catch (err) {
      setMessage(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setBusy(null); }
  }

  async function searchMembers() {
    const q = query.trim();
    if (q.length < 2) { setMessage("검색어를 2글자 이상 입력해 주세요."); return; }
    setSearching(true);
    setCandidates([]);
    try {
      const response = await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/roster?search=${encodeURIComponent(q)}`, { cache: "no-store" });
      const json: { ok?: boolean; candidates?: Candidate[]; error?: string } = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? `HTTP ${response.status}`);
      setCandidates(json.candidates ?? []);
      setMessage((json.candidates ?? []).length ? "" : "검색 결과가 없습니다. 먼저 디스코드 봇에서 Riot 계정을 등록해 주세요.");
    } catch (err) {
      setMessage(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setSearching(false); }
  }

  async function add(candidate: Candidate) {
    if (busy || !data?.editable) return;
    if (!window.confirm(`${candidate.name} (${candidate.riotId})\n\n${code} 내전에 추가할까요?\n확정 인원 10명이 차면 대기 명단에 등록됩니다.`)) return;
    setBusy(candidate.discordUserId);
    try {
      const response = await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/roster`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD", discordUserId: candidate.discordUserId }),
      });
      const json: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? `HTTP ${response.status}`);
      await refresh();
      setMessage(`${candidate.riotId} 추가 요청 완료. 봇이 서버 멤버를 확인한 뒤 약 25~60초 내 반영됩니다.`);
      setCandidates([]);
    } catch (err) {
      setMessage(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setBusy(null); }
  }

  const panel = { background: "#111714", border: "1px solid #29322c", borderRadius: 12, padding: 18 } as const;
  return (
    <main className="ng-scrim-subpage" style={{ minHeight: "100vh", background: "#080b09", color: "#f4f6f3", padding: "85px 18px", fontFamily: "inherit" }}>
      <section style={{ margin: "0 auto", maxWidth: 1050 }}>
        <Link href={`/admin/scrims/${encodeURIComponent(code)}`} style={{ color: "#9ba79c", textDecoration: "none", fontSize: 13 }}>← 내전 관리로 돌아가기</Link>
        <header style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", margin: "18px 0 26px", flexWrap: "wrap" }}>
          <div><p style={{ color: "#82968a", fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>내전.GG ADMIN</p><h1 style={{ fontSize: 27, margin: 0 }}>{code} 참가자 관리</h1></div>
          <button type="button" onClick={() => { setLoading(true); void refresh(); }} style={{ border: "1px solid #47554b", borderRadius: 8, padding: "10px 16px", background: "#202b23", color: "white", cursor: "pointer" }}>새로고침</button>
        </header>
        <div style={{ ...panel, display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 18 }}>
          <div>서버 확정 <strong style={{ color: "#bedbb8" }}>{data?.confirmedRds ?? "-"}명</strong></div>
          <div>디스코드 확정 <strong style={{ color: "#bedbb8" }}>{data?.snapshotAt ? data?.confirmedBot : "동기화 대기"}{data?.snapshotAt ? "명" : ""}</strong></div>
          <div>상태 <strong>{data?.status ?? "-"}</strong></div>
          {data?.snapshotAt && <div style={{ fontSize: 12, color: "#8b998e" }}>봇 명단 갱신: {new Date(data.snapshotAt).toLocaleString("ko-KR")}</div>}
        </div>
        <p style={{ color: "#a4b3a8", fontSize: 13 }}>참가자 11명 문제라면 제외할 소환사 한 명의 <strong>제외</strong> 버튼만 눌러줘. RDS와 디스코드 봇 명단을 모두 정리해.</p>
        <section style={{ ...panel, margin: "18px 0" }}>
          <h2 style={{ fontSize: 17, margin: "0 0 8px" }}>+ Discord 서버 회원 추가</h2>
          <p style={{ color: "#a4b3a8", fontSize: 12, margin: "0 0 14px" }}>
            내전.GG에 등록한 Discord 닉네임·사용자명·Riot 이름·Discord ID로 검색해. 실제 서버 회원인지는 봇이 확인해.
            확정 10명이면 자동으로 대기 등록돼.
          </p>
          <form onSubmit={e => { e.preventDefault(); void searchMembers(); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={query} onChange={e => setQuery(e.target.value)} disabled={!data?.editable}
              placeholder="Discord 이름 또는 Riot ID 검색" autoComplete="off"
              style={{ flex: "1 1 210px", minWidth: 150, borderRadius: 7, background: "#0b120d", color: "#f4f6f3", border: "1px solid #344438", padding: "12px 14px" }} />
            <button type="submit" disabled={!data?.editable || searching || !!busy}
              style={{ borderRadius: 7, background: "#29392c", color: "#d0ead0", border: "1px solid #506552", padding: "10px 18px", cursor: "pointer" }}>
              {searching ? "검색 중" : "회원 검색"}
            </button>
          </form>
          {!!candidates.length && <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {candidates.map(c => {
              const present = data?.participants.some(p => p.discordUserId === c.discordUserId && !p.removed);
              const pending = data?.addRequests?.find(p => p.discordUserId === c.discordUserId && p.status === "PENDING");
              return <div key={c.discordUserId} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", border: "1px solid #28382b", padding: "10px 12px", borderRadius: 7, flexWrap: "wrap" }}>
                <div><strong>{c.name}</strong> <span style={{ color: "#839588", fontSize: 12 }}>@{c.username}</span>
                  <div style={{ fontSize: 12, color: "#b1c3b3", marginTop: 4 }}>{c.riotId} · {c.discordUserId}</div>
                </div>
                <button type="button" disabled={!data?.editable || !!busy || !!present || !!pending} onClick={() => void add(c)}
                  style={{ border: "1px solid #4e6552", color: "#d8e9d5", background: "#263a29", padding: "9px 14px", borderRadius: 7, cursor: "pointer", opacity: present || pending ? .45 : 1 }}>
                  {present ? "이미 참가" : pending ? "추가 대기" : busy === c.discordUserId ? "처리 중" : "+ 추가"}
                </button>
              </div>;
            })}
          </div>}
          {!!data?.addRequests?.length && <div style={{ marginTop: 14, fontSize: 12, color: "#b7c9b8" }}>
            {data.addRequests.map(p => <p key={p.discordUserId} style={{ margin: "4px 0" }}>
              {p.status === "PENDING" ? "⏳" : "❌"} {p.discordUserId} — {p.status === "PENDING" ? "봇 확인 중" : `추가 실패: ${p.error ?? "봇 로그 확인"}`}
            </p>)}
          </div>}
        </section>
        {message && <p role="status" style={{ ...panel, color: message.startsWith("오류") ? "#f6aaa6" : "#bad6ac", margin: "14px 0" }}>{message}</p>}
        {loading && <p>명단 불러오는 중...</p>}
        <div style={{ display: "grid", gap: 9 }}>
          {(data?.participants ?? []).map((p, i) => (
            <article key={p.discordUserId} style={{ ...panel, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 15, flexWrap: "wrap", padding: "14px 18px", opacity: p.removed ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 200 }}>
                <span style={{ color: "#8ea395", minWidth: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                <div><strong style={{ fontSize: 15 }}>{p.name}</strong><div style={{ fontSize: 11, color: "#87988c", marginTop: 4 }}>{p.discordUserId}</div></div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#c2cfc5", flexWrap: "wrap" }}>
                <span>RDS: {p.rdsStatus ?? "없음"}</span><span>Discord: {p.botStatus ?? "미확인"}</span>
              </div>
              <button type="button" disabled={p.removed || !data?.editable || !!busy} onClick={() => void remove(p)} style={{ color: p.removed ? "#b4c0b6" : "#ffc4bc", padding: "9px 16px", background: p.removed ? "#222823" : "#34201f", border: "1px solid #63403c", borderRadius: 8, cursor: p.removed ? "default" : "pointer", opacity: !data?.editable ? .4 : 1 }}>
                {p.removed ? "제외됨" : busy === p.discordUserId ? "처리 중" : "제외"}
              </button>
            </article>
          ))}
        </div>
        {!data?.editable && data && <p style={{ color: "#e0b3ae" }}>팀 확정 또는 경기 시작 이후에는 인원을 변경할 수 없어.</p>}
      </section>
    </main>
  );
}
