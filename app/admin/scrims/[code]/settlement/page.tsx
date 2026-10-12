"use client";
import { useCallback,useEffect,useState } from "react";
import { useParams } from "next/navigation";
type Player={userId:string;discordUserId:string;riotId:string;team:string;score:number};
type Preview={ok:boolean;error?:string;winner:string;wins:{A:number;B:number};sets:{set:number;winner:string;verifiedBy?:string}[];
 suggestedMvp:string;suggestedAce:string;players:Player[]};
export default function SettlementPage(){
 const {code:raw}=useParams<{code:string}>();const code=String(raw??"").toUpperCase();
 const [info,setInfo]=useState<Preview|null>(null);const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);const [done,setDone]=useState(false);
 const [mvp,setMvp]=useState("");const [ace,setAce]=useState("");
 const load=useCallback(async()=>{setError("");setLoading(true);try{
   const res=await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/settlement`,{cache:"no-store"});
   const data=await res.json();if(!res.ok)throw new Error(data.error??"조회 실패");
   setInfo(data);setMvp(data.suggestedMvp);setAce(data.suggestedAce);
 }catch(e){setError(String(e instanceof Error?e.message:e))}finally{setLoading(false)}},[code]);
 useEffect(()=>{if(code)void load()},[code,load]);
 async function approve(){if(!info||done||loading)return;
   if(!confirm(`${code}의 BO3 결과를 확정하고 방패·보호권·GG코인을 10명에게 한 번 지급합니다. 계속할까요?`))return;
   setLoading(true);setError("");try{
     const res=await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/settlement`,{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({confirm:true,mvpUserId:mvp,aceUserId:ace})});
     const data=await res.json();if(!res.ok)throw new Error(data.error??"정산 실패");setDone(true);
   }catch(e){setError(String(e instanceof Error?e.message:e))}finally{setLoading(false)}
 }
 const fields={background:"#131619",border:"1px solid #333a37",color:"#fff",padding:12,borderRadius:4};
 return <main style={{background:"#090b0a",color:"#f7f7f7",minHeight:"100vh",padding:"42px max(20px,calc((100% - 1100px)/2))",fontFamily:"Arial,sans-serif"}}>
   <p style={{color:"#9bca66",fontSize:12}}>NAEGUN.GG · RANKED ADMIN</p><h1 style={{fontSize:30,marginTop:10}}>{code} · BO3 최종 정산</h1>
   <p style={{color:"#9caaa0"}}>결과를 확인하기 전까지 코인·보호권·방패는 지급되지 않습니다.</p>
   {error&&<div style={{color:"#ffc6c6",margin:"20px 0"}}>오류: {error}</div>}
   {done?<h2 style={{color:"#a7db7c",padding:20}}>정산 완료 · F~S Discord 역할 자동 동기화 대기</h2>:
    info&&<><section style={{...fields,margin:"24px 0"}}>
      <h2>최종 승리팀: {info.winner} ({info.wins.A} : {info.wins.B})</h2>
      <p>{info.sets.map(s=>`${s.set}세트 ${s.winner}팀 승리`).join(" · ")}</p>
    </section><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
       {(["A","B"] as const).map(team=><section key={team} style={fields}><h3>{team}팀</h3>
          {info.players.filter(p=>p.team===team).map(p=><div key={p.userId} style={{padding:10,borderBottom:"1px solid #303634"}}>
             {p.riotId}<span style={{float:"right",color:"#aac38f"}}>{(p.score*100).toFixed(1)}점</span></div>)}
       </section>)}
    </div><section style={{...fields,marginTop:20}}><h3>MVP / ACE 확인</h3>
     <p>승리팀 MVP (+50%), 패배팀 ACE (+25%). 필요하면 운영자가 변경할 수 있습니다.</p>
     <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
      <label>승리 MVP <select value={mvp} onChange={e=>setMvp(e.target.value)} style={fields}>
       {info.players.filter(p=>p.team===info.winner).map(p=><option key={p.userId} value={p.userId}>{p.riotId}</option>)}
      </select></label>
      <label>패배 ACE <select value={ace} onChange={e=>setAce(e.target.value)} style={fields}>
       {info.players.filter(p=>p.team!==info.winner).map(p=><option key={p.userId} value={p.userId}>{p.riotId}</option>)}
      </select></label>
     </div><button disabled={loading} onClick={approve} style={{marginTop:22,background:"#a5d37d",color:"#0b130a",border:0,borderRadius:4,padding:"14px 24px",fontWeight:700,cursor:"pointer"}}>
       {loading?"처리 중...":"BO3 최종 승인 · 10명 일괄 정산"}</button>
    </section></>}
    {!info&&!done&&<button disabled={loading} onClick={()=>void load()} style={{...fields,cursor:"pointer"}}>다시 조회</button>}
 </main>;
}
