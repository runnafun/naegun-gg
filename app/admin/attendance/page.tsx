'use client';
import {useCallback,useEffect,useState} from 'react';
import {ATTENDANCE_DEFAULT,type AttendanceReward} from '@/app/lib/attendance-config';
import './attendance-admin.css';
type SetRow={id:string;title:string;startDate:string;status:string;createdAt:string;claims:number;rewards:AttendanceReward[]};
const OPTIONS=[{value:'COIN',label:'GG코인'},{value:'rank-shield',label:'랭크 보호막'},{value:'rank-double',label:'랭크 2배 티켓'},{value:'no-ban',label:'노벤 티켓'},{value:'choice-low',label:'저가 테두리 선택권'}];
function kindFor(value:string){return value==='COIN'?'COIN':value==='choice-low'?'CHOICE':'ITEM'}
function iconFor(value:string){return ({COIN:'coin','rank-shield':'shield','rank-double':'double','no-ban':'noban','choice-low':'choice'} as Record<string,string>)[value]||'coin'}
function labelFor(value:string,amount:number){return value==='COIN'?`${amount}GG 코인`:({ 'rank-shield':'랭크 보호막','rank-double':'랭크 2배 티켓','no-ban':'노벤 티켓','choice-low':'테두리 선택권'} as Record<string,string>)[value]||''}
function skuFor(r:AttendanceReward){return r.kind==='COIN'?'COIN':r.sku||''}
export default function AttendanceAdmin(){
 const [sets,setSets]=useState<SetRow[]>([]),[now,setNow]=useState(''),[selected,setSelected]=useState('');
 const [title,setTitle]=useState('내전.GG 1차 출석 이벤트'),[date,setDate]=useState('');
 const [rows,setRows]=useState<AttendanceReward[]>(ATTENDANCE_DEFAULT.map(x=>({...x})));
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const res=await fetch('/api/admin/attendance',{cache:'no-store'});const j=await res.json();if(!res.ok)throw Error(j.error);setSets(j.sets);setNow(j.today);setDate(old=>old||j.today)},[]);
 useEffect(()=>{void load().catch(e=>setError(String(e)))},[load]);
 const current=sets.find(s=>s.id===selected);
 useEffect(()=>{if(!current)return;setRows(current.rewards.map(r=>({...r})));setTitle(current.title);setDate(current.startDate)},[selected]);
 async function action(action:string,payload:Record<string,unknown>={}){
  if(busy)return;setError('');setMessage('');setBusy(true);
  try{const response=await fetch('/api/admin/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});const out=await response.json();if(!response.ok)throw Error(out.error||'요청 실패');await load();if(action==='CREATE')setSelected(out.id);setMessage('정상 처리되었습니다.')}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 }
 function change(day:number,patch:Partial<AttendanceReward>){setRows(old=>old.map(r=>r.day===day?{...r,...patch}:r))}
 const selectedDraft=current?.status==='DRAFT';
 return <div className="ng-att-admin"><h1>출석체크 · 14일 세트 관리</h1><p className="hint">관리자가 세트를 생성하고 공개해야 활성화됩니다. 시작일부터 14일이 지나면 자동으로 종료되며, 다음 세트가 없으면 출석체크가 없습니다.</p>
  <div className="ng-att-admin-columns"><section className="panel"><h2>출석 세트</h2><label>세트 이름<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={60}/></label><label>시작일 (한국시간)<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
  <button className="primary" disabled={busy} onClick={()=>void action('CREATE',{title,startDate:date})}>+ 14일 새 세트 생성 (비공개)</button>
  <div className="set-list">{sets.map(s=><button key={s.id} className={selected===s.id?'sel':''} onClick={()=>setSelected(s.id)}><b>{s.title}</b><small>{s.startDate} ~ 14일 · {s.status==='DRAFT'?'초안':s.status==='PUBLISHED'?'공개':'종료'} · 지급 {s.claims}건</small></button>)}</div></section>
  <section className="panel"><h2>14일 보상 편집</h2>{!current?<p className="hint">새 세트를 만든 다음 해당 세트를 선택하면 보상을 수정할 수 있습니다.</p>:<><p className="hint">{current.title} · {current.startDate} 시작 · {current.status==='DRAFT'?'비공개 편집 가능':'공개 또는 종료된 세트는 수정할 수 없습니다.'}</p>
  <div className="reward-table"><div className="thead"><span>일차</span><span>보상 유형</span><span>수량</span><span>표시 문구</span><span>아이콘 크기</span></div>
  {rows.map(r=><div className="rrow" key={r.day}><b>{r.day}일</b><select disabled={!selectedDraft||busy} value={skuFor(r)} onChange={e=>{const v=e.target.value;const k=kindFor(v),amount=k==='COIN'?50:1;change(r.day,{kind:k,sku:k==='COIN'?null:v,amount,label:labelFor(v,amount),icon:iconFor(v),iconScale:v==='COIN'?1.27:1.22})}}>{OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><input disabled={!selectedDraft||busy||r.kind!=='COIN'} type="number" min={1} max={500} value={r.amount} onChange={e=>change(r.day,{amount:Number(e.target.value),label:labelFor('COIN',Number(e.target.value))})}/><input disabled={!selectedDraft||busy} value={r.label} maxLength={28} onChange={e=>change(r.day,{label:e.target.value})}/><input disabled={!selectedDraft||busy} type="number" min="0.7" max="1.6" step="0.05" value={r.iconScale} onChange={e=>change(r.day,{iconScale:Number(e.target.value)})}/></div>)}
  </div>
  <div className="actions">{selectedDraft&&<><button disabled={busy} onClick={()=>void action('SAVE',{id:current.id,rewards:rows})}>보상 설정 저장</button><button className="primary" disabled={busy} onClick={()=>{if(confirm('14일 보상 설정을 저장했나요? 공개 후 보상 수정이 잠깁니다.'))void action('PUBLISH',{id:current.id})}}>세트 공개하기</button></>}{current.status==='PUBLISHED'&&<button className="danger" disabled={busy} onClick={()=>{if(confirm('진행 중인 출석체크를 조기 종료할까요?'))void action('CLOSE',{id:current.id})}}>세트 조기 종료</button>}<a href="/attendance" target="_blank" rel="noreferrer">출석 페이지 확인 ↗</a></div></>}
  </section></div>
  {error&&<p className="error">{error}</p>}{message&&<p className="success">{message}</p>}
 </div>
}
