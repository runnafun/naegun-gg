'use client';
import {useCallback,useEffect,useState} from 'react';
type Row={id:string;title:string;status:string;gameName:string|null;tagLine:string|null;createdAt:string};
export default function TitleRequests(){
 const [rows,setRows]=useState<Row[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState('');
 const load=useCallback(async()=>{try{const r=await fetch('/api/admin/shop-titles',{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.error);setRows(d.rows)}catch(e){setError(String(e))}},[]);
 useEffect(()=>{void load()},[load]);
 async function decide(id:string,action:string){if(!confirm(`${action==='APPROVE'?'칭호 승인':'칭호 거절'} 처리할까요?`))return;setBusy(id);try{const r=await fetch('/api/admin/shop-titles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action})});const d=await r.json();if(!r.ok)throw Error(d.error);await load()}catch(e){setError(String(e))}finally{setBusy('')}}
 return <main style={{minHeight:'100vh',background:'#090e0c',color:'#eee',padding:35}}><h1>내전.GG · 커스텀 칭호 승인</h1><p>{error}</p>{rows.map(row=><article key={row.id} style={{background:'#18231d',border:'1px solid #344739',padding:17,marginBottom:12}}><b>{row.gameName??'미연동'}#{row.tagLine??'-'}</b> · <strong>{row.title}</strong> · {row.status}<p style={{color:'#adb6ad'}}>{row.createdAt}</p>{row.status==='PENDING'&&<><button disabled={busy===row.id} onClick={()=>decide(row.id,'APPROVE')}>승인</button><button disabled={busy===row.id} onClick={()=>decide(row.id,'REJECT')} style={{marginLeft:10}}>거절 / 티켓 반환</button></>}</article>)}</main>
}
