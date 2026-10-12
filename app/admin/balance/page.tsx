"use client";
import { useCallback, useEffect, useState } from "react";
import {
  absoluteLpLabel, adjustedAbsoluteLp, baseTierLabel, BALANCE_TIER_NAMES,
  BALANCE_DIVISIONS, type BalanceTier,
} from "@/app/lib/balance-lp";
import "./balance.css";

type Member = {
  id: string; status: string; name: string; discord: string;
  current: BalanceTier; peak: BalanceTier; manualBase: BalanceTier | null;
  evaluationLpOffset: number; effectiveLp: number | null; effectiveLabel: string;
  baseLabel: string; legacyEvaluation: number | null;
};
const tierKo: Record<string,string> = {
  IRON:"아이언", BRONZE:"브론즈", SILVER:"실버", GOLD:"골드",
  PLATINUM:"플래티넘", EMERALD:"에메랄드", DIAMOND:"다이아몬드",
  MASTER:"마스터", GRANDMASTER:"그랜드마스터", CHALLENGER:"챌린저",
};
const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache:"no-store", ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}
function formatLp(n:number) { return `${n > 0 ? "+" : ""}${n.toLocaleString("ko-KR")}LP`; }

export default function BalanceAdminPage() {
  const [keyword,setKeyword] = useState("");
  const [applied,setApplied] = useState("");
  const [members,setMembers] = useState<Member[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [edit,setEdit] = useState<string|null>(null);
  const [offset,setOffset] = useState(0);
  const [reason,setReason] = useState("운영진 팀 밸런스 평가 조정");
  const [manualMode,setManualMode] = useState(false);
  const [manualBase,setManualBase] = useState<BalanceTier>({ tier:"GOLD", rank:"IV", lp:0 });
  const load = useCallback(async (q:string) => {
    setLoading(true);
    try { const result = await api(`/api/admin/console/balance?q=${encodeURIComponent(q)}`); setMembers(result.members || []); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(""); }, [load]);
  function open(m:Member) {
    setEdit(m.id);setOffset(m.evaluationLpOffset);
    setManualMode(Boolean(m.manualBase));
    setManualBase(m.manualBase || {tier:m.current.tier || "GOLD",rank:m.current.rank || "IV",lp:m.current.lp || 0});
    setError("");setNotice("");
  }
  async function save(payload:Record<string,unknown>, name:string) {
    if (busy) return false;
    setBusy(true);setError("");setNotice("");
    try {
      const data = await api("/api/admin/console/balance", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...payload,note:reason.trim() || "운영진 티어 평가 조정"}),
      });
      setNotice(`${name} · ${data.effectiveLabel} 반영 완료. 다음 자동 팀 배정부터 적용됩니다.`);
      await load(applied);
      return true;
    } catch (e) { setError((e as Error).message); return false; }
    finally { setBusy(false); }
  }
  const member = members.find(m => m.id === edit);
  const currentBase:BalanceTier = manualMode ? manualBase : (member?.current || {});
  const preview = adjustedAbsoluteLp(currentBase,offset);
  const previewLabel = absoluteLpLabel(preview);
  return <div className="ng-rating-page">
    <header className="ng-rating-heading"><div><p className="ng-rating-kicker">TEAM BALANCE / LP ADJUSTMENT</p>
      <h1>티어 평가 관리</h1>
      <p>실제 솔로랭크 누적 LP에 관리자 보정 LP만 반영합니다. 탑레는 참고용이며 내전 방패·보호 게이지는 사용하지 않습니다.</p>
    </div><span className="ng-rating-chip">RDS 실시간</span></header>
    <div className="ng-rating-stat"><strong>팀 자동 배정 전력 공식</strong>
      <span>최종 평가 LP = 현재 솔로랭크 누적 LP + 관리자 보정 LP</span>
      <small>팀 전력: 양 팀 LP 합계 70% · 라인별 차이 20% · 포지션 선호도 10%. 확정된 팀은 변경하지 않습니다.</small>
    </div>
    <form className="ng-rating-search" onSubmit={e=>{e.preventDefault();setApplied(keyword.trim());void load(keyword.trim());}}>
      <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="소환사명 / Discord 이름 / Discord ID 검색"/>
      <button type="submit">검색</button>
      <button type="button" onClick={()=>{setKeyword("");setApplied("");void load("");}}>초기화</button>
    </form>
    {error&&<div className="ng-rating-error">❌ {error}</div>}
    {notice&&<div className="ng-rating-success">✓ {notice}</div>}
    <div className="ng-rating-tablewrap"><table className="ng-rating-table"><thead><tr>
      <th>선수</th><th>현재 솔랭</th><th>탑레(참고)</th><th>보정 LP</th><th>최종 평가 티어</th><th>빠른 조정</th><th>설정</th>
    </tr></thead><tbody>
    {members.map(m=><tr key={m.id}>
      <td><b>{m.name}</b><small>{m.discord}</small></td>
      <td>{baseTierLabel(m.current)}{m.manualBase&&<small>수동 기준 적용: {baseTierLabel(m.manualBase)}</small>}</td>
      <td>{m.peak.tier ? baseTierLabel(m.peak) : "미등록"}</td>
      <td><strong className="ng-rating-value">{formatLp(m.evaluationLpOffset)}</strong></td>
      <td><b>{m.effectiveLabel}</b></td>
      <td><div className="ng-rating-actions">
        {[-100,-10,10,100].map(step=><button key={step} type="button" disabled={busy} onClick={()=>void save({userId:m.id,delta:step},m.name)}>{step>0?"+":""}{step}</button>)}
      </div></td>
      <td><button type="button" className="ng-rating-edit" onClick={()=>open(m)}>자세히</button></td>
    </tr>)}
    {!loading&&members.length===0&&<tr><td className="ng-rating-empty" colSpan={7}>검색된 선수가 없습니다.</td></tr>}
    </tbody></table>{loading&&<p className="ng-rating-loading">선수 정보를 불러오는 중...</p>}</div>
    <p className="ng-rating-foot">기존 0~100 평가값은 보존하지만 팀 전력 계산에는 사용하지 않습니다. 빠른 조정은 즉시 저장되고 관리자 로그에 기록됩니다.</p>
    {member&&<div className="ng-rating-modalcover" onClick={()=>!busy&&setEdit(null)}>
      <section className="ng-rating-modal ng-rating-lp-modal" role="dialog" aria-modal="true" aria-label="LP 평가 편집" onClick={e=>e.stopPropagation()}>
        <div className="ng-rating-modalhead"><div><small>PLAYER RATING / LIVE PREVIEW</small><h2>{member.name}</h2></div><button type="button" disabled={busy} onClick={()=>setEdit(null)} aria-label="닫기">✕</button></div>
        <div className="ng-lp-compare"><div><small>현재 솔로랭크</small><strong>{baseTierLabel(member.current)}</strong></div><span className="ng-lp-arrow">→</span><div><small>보정 후 평가 티어</small><strong>{previewLabel}</strong></div></div>
        <label>관리자 보정 LP
          <input type="number" step="1" value={offset} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))setOffset(Math.trunc(n));}}/>
        </label>
        <input aria-label="LP 보정 슬라이더" className="ng-lp-slider" type="range" min={-3000} max={3000} step={10} value={Math.max(-3000,Math.min(3000,offset))} onChange={e=>setOffset(Number(e.target.value))}/>
        <div className="ng-lp-range"><span>-3,000</span><span>0</span><span>+3,000LP</span></div>
        <div className="ng-rating-actions ng-lp-steps">{[-1000,-500,-100,100,500,1000].map(step=><button key={step} type="button" onClick={()=>setOffset(v=>v+step)}>{step>0?"+":""}{step}</button>)}</div>
        <label className="ng-rating-peakcheck"><input type="checkbox" checked={manualMode} onChange={e=>setManualMode(e.target.checked)}/> 수동 기준 티어 사용 (현재 솔랭 정보가 없거나 잘못된 경우)</label>
        {manualMode&&<div className="ng-rating-peakgrid">
          <label>기준 티어<select value={manualBase.tier||""} onChange={e=>{const t=e.target.value;setManualBase({tier:t,rank:apex.includes(t)?null:manualBase.rank||"IV",lp:0});}}>{BALANCE_TIER_NAMES.map(t=><option key={t} value={t}>{tierKo[t]}</option>)}</select></label>
          {!apex.includes(String(manualBase.tier))&&<label>단계<select value={manualBase.rank||"IV"} onChange={e=>setManualBase(p=>({...p,rank:e.target.value}))}>{BALANCE_DIVISIONS.map(r=><option key={r} value={r}>{r}</option>)}</select></label>}
          <label>기준 LP<input type="number" min={0} step={1} value={manualBase.lp ?? 0} onChange={e=>setManualBase(p=>({...p,lp:Number(e.target.value)}))}/></label>
        </div>}
        <div className="ng-lp-explainer"><strong>다음 팀 배정 적용 전력</strong><span>{baseTierLabel(currentBase)} {offset>=0?"+":"−"} {Math.abs(offset).toLocaleString("ko-KR")}LP = <b>{previewLabel}</b></span><small>마스터 이상은 공식 그마·챌린저 승급 컷이 유동적이라 ‘마스터 환산 LP’로 표시합니다.</small></div>
        <label>수정 사유<input value={reason} onChange={e=>setReason(e.target.value)} maxLength={200}/></label>
        <div className="ng-rating-modalfoot">
          <button type="button" disabled={busy} onClick={()=>setEdit(null)}>취소</button>
          <button type="button" disabled={busy||preview===null||!Number.isSafeInteger(offset)||Math.abs(offset)>1000000||!reason.trim()} onClick={async()=>{
            const ok=await save({userId:member.id,evaluationLpOffset:offset,manualBase:manualMode?manualBase:null},member.name);
            if(ok)setEdit(null);
          }}>{busy?"저장 중...":"저장하기"}</button>
        </div>
      </section>
    </div>}
  </div>;
}
