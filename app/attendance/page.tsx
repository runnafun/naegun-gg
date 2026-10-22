'use client';
import {useCallback,useEffect,useState} from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import {ATTENDANCE_ICONS,type AttendanceReward} from '@/app/lib/attendance-config';
import './attendance.css';
type AttendanceState={ok:boolean;active:boolean;message?:string;day:number;today:string;rewards:AttendanceReward[];claimed:number[];loggedIn:boolean;set?:{id:string;title:string;startDate:string}};
const errors:Record<string,string>={LOGIN_REQUIRED:'디스코드 로그인 후 출석할 수 있습니다.',ALREADY_CLAIMED:'오늘 보상을 이미 받았습니다.',NO_ACTIVE_ATTENDANCE:'진행 중인 출석체크가 없습니다.',ATTENDANCE_EXPIRED:'출석 기간이 종료되었습니다.',INVALID_ATTENDANCE_REWARD:'보상 설정에 문제가 있습니다. 관리자에게 문의하세요.'};
export default function AttendancePage(){
 const [state,setState]=useState<AttendanceState|null>(null);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{try{const r=await fetch('/api/attendance',{cache:'no-store'});const j=await r.json();if(!r.ok)throw Error(j.error||'출석 데이터를 불러오지 못했습니다.');setState(j)}catch(e){setError(e instanceof Error?e.message:String(e))}},[]);
 useEffect(()=>{void refresh();const onVisible=()=>{if(document.visibilityState==='visible')void refresh()};document.addEventListener('visibilitychange',onVisible);return()=>document.removeEventListener('visibilitychange',onVisible)},[refresh]);
 async function claim(){if(!state?.active||busy)return;if(!state.loggedIn){window.location.assign('/api/auth/discord');return};setBusy(true);setError('');setMessage('');try{const r=await fetch('/api/attendance',{method:'POST',credentials:'same-origin'});const j=await r.json();if(!r.ok)throw Error(errors[j.error]||j.error||'출석에 실패했습니다.');setMessage(`${j.day}일차 출석 완료! ${j.reward} 보상이 지급됐습니다.`);window.dispatchEvent(new Event('naegun-shop-updated'));await refresh()}catch(e){setError(e instanceof Error?e.message:String(e));await refresh()}finally{setBusy(false)}}
 const active=state?.active===true;
 const todayClaimed=state?.claimed.includes(state.day)??false;
 return <main className="ng-att-page"><Header/><div className="ng-att-bg" aria-hidden="true"/><div className="ng-att-scrim-overlay" aria-hidden="true"/>
 <div className="ng-att-content">
  <section className="ng-att-hero"><h1>출석체크를 하여 매일매일 보상을 챙겨가세요</h1><p>다양한 보상을 새로 받아가실 수 있습니다.</p></section>
  {!state&&!error&&<div className="ng-att-empty">출석체크 정보를 불러오는 중...</div>}
  {!active&&state&&<div className="ng-att-empty"><strong>출석체크가 없습니다</strong><p>관리자가 새로운 14일 출석 세트를 공개하면 이곳에서 확인할 수 있습니다.</p></div>}
  {active&&<>
    <div className="ng-att-grid" aria-label="14일 출석 보상">
    {state.rewards.map(r=>{
      const past=r.day<state.day&&!state.claimed.includes(r.day),today=r.day===state.day,received=state.claimed.includes(r.day);
      return <div key={r.day} className={`ng-att-card ${received?'is-claimed':''} ${today?'is-today':''} ${past?'is-missed':''} ${r.day>state.day?'is-upcoming':''}`}>
         <img className="ng-att-base" src="/attendance-assets/checkbox.png" alt="" loading={r.day>7?'lazy':'eager'}/>
         <div className="ng-att-number">{r.day}일</div>
         <div className="ng-att-symbol"><img src={ATTENDANCE_ICONS[r.icon]||ATTENDANCE_ICONS.coin} alt="" style={{transform:`scale(${r.iconScale})`}} loading={r.day>7?'lazy':'eager'}/></div>
         <div className={`ng-att-label ${r.label.length>9?'ng-att-label--small':''}`}>{r.label}</div>
         {received&&<div className="ng-att-claim-mask"><span>지급완료</span></div>}
         {past&&<div className="ng-att-past-mask"><span>미출석</span></div>}
       </div>
     })}
    </div>
    <div className="ng-att-bottom">
      <button className="ng-att-check-btn" disabled={busy||todayClaimed} onClick={()=>void claim()}>{todayClaimed?'오늘 출석 완료':busy?'보상 지급 중...':state.loggedIn?'오늘 출석하기':'로그인 후 출석하기'}</button>
      <p className="ng-att-period">14일 세트 · {state.set?.startDate} 시작 · 하루 1회, 한국시간 00:00 기준</p>
      {message&&<p className="ng-att-feedback" role="status">{message}</p>}
    </div>
  </>}
  {error&&<p className="ng-att-error" role="alert">{error}</p>}
 </div><Footer/></main>
}
