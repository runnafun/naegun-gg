"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Side = "A" | "B";
type Position = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
type Member = { userId: string; discordUserId: string; name: string; team: Side; assignedPosition: Position };
type ResponseData = {
  ok: boolean; status: string; editable: boolean; hasResults: boolean;
  revision: string; players: Member[]; error?: string; notice: string;
};
const positions: Position[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
const posKr: Record<Position, string> = { TOP: "탑", JUNGLE: "정글", MID: "미드", ADC: "AD", SUPPORT: "서폿" };
const inputStyle = { background: "#121813", border: "1px solid #354338", padding: "8px 10px", borderRadius: 6, color: "#e8f0e6" };

export default function TeamEditor({ code }: { code: string }) {
  const [source, setSource] = useState<ResponseData | null>(null);
  const [players, setPlayers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/team-editor`, { cache: "no-store" });
    const json: ResponseData = await r.json();
    if (!r.ok || !json.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
    setSource(json); setPlayers(json.players ?? []);
    setMessage("");
  }, [code]);
  useEffect(() => { void load().catch(e => setMessage(String(e))); }, [load]);
  const set = (userId: string, changes: Partial<Member>) => setPlayers(old => old.map(p => p.userId === userId ? { ...p, ...changes } : p));
  const byTeam = (team: Side) => players.filter(p => p.team === team);
  const countA = players.filter(p => p.team === "A").length;
  const countB = players.filter(p => p.team === "B").length;
  const valid = useMemo(() => {
    if (players.length !== 10 || countA !== 5 || countB !== 5) return false;
    return ["A", "B"].every(team => new Set(players.filter(p => p.team === team).map(p => p.assignedPosition)).size === 5);
  }, [players, countA, countB]);

  async function save() {
    if (busy || !source?.editable || !valid) return;
    if (!window.confirm(`${code} 팀을 저장할까요?\n\n저장되면 웹사이트·디스코드 봇에 적용되고, 확정 후 변경은 팀원들에게 다시 안내됩니다.`)) return;
    setBusy(true); setMessage("");
    try {
      const toPayload = (team: Side) => players.filter(p => p.team === team).map(p => ({ userId: p.userId, assignedPosition: p.assignedPosition }));
      const r = await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/team-editor`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blue: toPayload("A"), red: toPayload("B"), revision: source.revision }),
      });
      const data: { ok?: boolean; error?: string; message?: string } = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      await load(); setMessage("✅ 저장 완료. 디스코드 모집글과 DM은 최대 약 25~60초 내 갱신됩니다. 게임 트래커는 팀 명단을 다시 조회해 주세요.");
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#090c0a", color: "#f1f5ee", padding: "90px 20px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <Link href={`/admin/scrims/${encodeURIComponent(code)}`} style={{ color: "#a3b5a5", textDecoration: "none", fontSize: 13 }}>← 팀 배정 관리로 돌아가기</Link>
        <div style={{ margin: "22px 0", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 15, justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 12, color: "#849a8a", letterSpacing: 2 }}>내전.GG ADMIN</div><h1 style={{ fontSize: 28, margin: "4px 0" }}>{code} 팀 자유 편집</h1><div style={{ fontSize: 13, color: "#a2b4a4" }}>팀 배정 후 · 팀 확정 후에도 선수 및 라인 직접 변경 가능</div></div>
          <button style={{ ...inputStyle, cursor: "pointer" }} type="button" disabled={busy} onClick={() => void load().catch(e => setMessage(String(e)))}>새로고침</button>
        </div>
        {source && <p style={{ background: "#141a15", border: "1px solid #2c3b30", padding: 14, borderRadius: 8, color: "#b3c2b4", fontSize: 13 }}>
          <strong style={{ color: "#e6efe4" }}>경기 상태: {source.status}</strong> · {source.notice}
          {source.hasResults && <strong style={{ color: "#f1b5ae" }}> 이미 세트 결과가 접수되어 잠금 상태입니다.</strong>}
        </p>}
        {message && <p role="status" style={{ padding: 15, background: "#1a231c", border: "1px solid #354b38", borderRadius: 8, color: message.startsWith("❌") ? "#f7c1b9" : "#c4dfc4" }}>{message}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 18, marginTop: 22 }}>
          {(["A", "B"] as Side[]).map(team => {
            const list = byTeam(team);
            return <section key={team} style={{ border: `1px solid ${team === "A" ? "#36556e" : "#5d3431"}`, background: "#111512", borderRadius: 11, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
                <h2 style={{ fontSize: 19, margin: 0, color: "#f0f5ef" }}>{team === "A" ? "🔵 블루팀 (A)" : "🔴 레드팀 (B)"}</h2>
                <strong style={{ color: list.length === 5 ? "#c9e0c2" : "#f1b0a4" }}>{list.length}/5</strong>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {list.map(player => <div key={player.userId} style={{ border: "1px solid #2c382e", background: "#1b211b", borderRadius: 8, padding: 13 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflowWrap: "anywhere", marginBottom: 8 }}>{player.name}</div>
                  <div style={{ fontSize: 11, color: "#809388", marginBottom: 9 }}>{player.discordUserId}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>팀
                      <select value={player.team} disabled={!source?.editable || busy} onChange={e => set(player.userId, { team: e.target.value as Side })} style={inputStyle}>
                        <option value="A">블루</option><option value="B">레드</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>라인
                      <select value={player.assignedPosition} disabled={!source?.editable || busy} onChange={e => set(player.userId, { assignedPosition: e.target.value as Position })} style={inputStyle}>
                        {positions.map(pos => <option key={pos} value={pos}>{posKr[pos]}</option>)}
                      </select>
                    </label>
                  </div>
                </div>)}
              </div>
              {!list.length && <p style={{ color: "#819484" }}>선수가 없습니다.</p>}
            </section>;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 15, marginTop: 22, alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, color: valid ? "#a7caaa" : "#f0b0a5" }}>
            {valid ? "✅ 팀별 5명과 5개 라인 배치 완료 · 저장 가능" : "저장하려면 블루 5명 / 레드 5명, 각 팀 탑·정글·미드·AD·서폿 1명씩 필요해."}
          </p>
          <button type="button" onClick={() => void save()} disabled={!valid || !source?.editable || busy}
            style={{ border: "1px solid #6a9b70", background: "#2b4930", color: "#f0fff0", borderRadius: 7, padding: "12px 26px", cursor: valid && source?.editable ? "pointer" : "not-allowed", opacity: valid && source?.editable ? 1 : 0.45, fontWeight: 700 }}>
            {busy ? "저장 중..." : "팀 변경 저장"}
          </button>
        </div>
      </div>
    </main>
  );
}
