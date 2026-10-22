"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type State = { ok: boolean; code: string; status: string; eligible: boolean; blockReason?: string | null;
  checks: { rankSettlement: number; trackerSets: number; rewards: number; gameRecords: number } };

export default function ForceEndPage() {
  const params = useParams();
  const code = String(params.code ?? "").toUpperCase();
  const [state, setState] = useState<State | null>(null);
  const [reason, setReason] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/admin/scrims/${encodeURIComponent(code)}/force-end`;

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint, { cache: "no-store" }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (!cancelled) setState(data);
    }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [endpoint]);

  async function forceEnd() {
    if (busy || !state?.eligible || confirmCode !== code || reason.trim().length < 5) return;
    if (!window.confirm(`${code} 내전을 기록 없이 강제 종료할까요?\n정상 정산과 승패·GG코인 지급은 진행되지 않습니다.`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessage(data.message); setState(prev => prev ? { ...prev, status: "CANCELLED", eligible: false } : prev);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const fieldStyle = { padding: "12px", background: "#101b1e", border: "1px solid #4b5f62",
    color: "#edf7f4", width: "100%", maxWidth: 520 };
  return <main className="ng-scrim-subpage" style={{ maxWidth: 940, padding: "24px 8px", color: "#e9f0ee" }}>
    <Link href={`/admin/scrims/${encodeURIComponent(code)}`} style={{ color: "#a7bdb8" }}>← {code} 내전 관리</Link>
    <h1 style={{ fontSize: 28, margin: "22px 0 12px" }}>내전 기록 없이 강제 종료</h1>
    <p style={{ lineHeight: 1.8, color: "#a5b8b5" }}>
      트래커가 참가자 불일치로 경기 기록을 수집하지 못했을 때 사용합니다.
      종료 상태는 <b>CANCELLED</b>이며 승패, 내전 랭크 점수, GG코인 정산은 발생하지 않습니다.
      참가자 정보와 기존 감사 기록은 삭제하지 않습니다.
    </p>
    <section style={{ border: "1px solid #405457", background: "#172426", padding: 22, marginTop: 20 }}>
      <p><b>내전 코드:</b> {code} · <b>현재 상태:</b> {state?.status ?? "조회 중"}</p>
      {state && <p style={{ color: state.eligible ? "#a4deb9" : "#e6b9a3", lineHeight: 1.7 }}>
        {state.eligible ? "기록·정산·지급 내역이 없어 종료할 수 있습니다. (R/N 내전 공통)"
          : `강제 종료 불가: ${state.blockReason ?? "현재 상태에서는 종료할 수 없습니다."}`}
      </p>}
      {state && <p style={{ fontSize: 13, color: "#a7b6b5" }}>
        트래커 세트 {state.checks.trackerSets}건 · 생성된 게임 {state.checks.gameRecords}건 · GG코인 지급 {state.checks.rewards}건 · 정산 {state.checks.rankSettlement}건
      </p>}
      <label style={{ display: "block", marginTop: 20 }}>종료 사유 (5자 이상)
        <input style={{ ...fieldStyle, display: "block", marginTop: 8 }} value={reason}
          onChange={e => setReason(e.target.value)} maxLength={200}
          placeholder="예: 참가자 Riot 계정 불일치로 트래커 수집 실패" />
      </label>
      <label style={{ display: "block", marginTop: 18 }}>확인용 내전 코드 입력
        <input style={{ ...fieldStyle, display: "block", marginTop: 8 }} value={confirmCode}
          onChange={e => setConfirmCode(e.target.value.toUpperCase())} placeholder={code} />
      </label>
      <button type="button" onClick={() => void forceEnd()}
        disabled={busy || !state?.eligible || confirmCode !== code || reason.trim().length < 5}
        style={{ marginTop: 24, padding: "12px 22px", background: "#8d493f", border: "1px solid #ad6c61",
          color: "white", cursor: "pointer", opacity: busy || !state?.eligible ? 0.5 : 1 }}>
        {busy ? "강제 종료 처리 중..." : `${code} 기록 없이 강제 종료`}
      </button>
      {message && <p role="status" style={{ color: "#91d6b4", marginTop: 16 }}>{message}</p>}
      {error && <p role="alert" style={{ color: "#ffb4aa", marginTop: 16 }}>{error}</p>}
    </section>
    <p style={{ marginTop: 18, color: "#a7b6b5", lineHeight: 1.8 }}>
      처리 후 운영 DB 상태가 CANCELLED로 변경됩니다. Discord 봇의 모집글 상태가 실제로 동기화됐는지도 확인해 주세요.
      이후 관리자 회원 관리에서 올바른 Riot 계정으로 변경할 수 있습니다.
    </p>
  </main>;
}
