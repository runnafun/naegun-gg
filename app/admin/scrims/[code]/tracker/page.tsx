"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
type Report = {id:string;createdAt:string;afterData:{set?:number;winner?:string;verifiedBy?:string;status?:string;players?:unknown[]}};
export default function TrackerAdminPage(){
  const params=useParams<{code:string}>();
  const code=String(params.code??"").toUpperCase();
  const [reports,setReports]=useState<Report[]>([]);
  const [error,setError]=useState("");
  const load=useCallback(async()=>{
    try{
      const res=await fetch(`/api/admin/scrims/${encodeURIComponent(code)}/tracker-reports`,{cache:"no-store"});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error??"조회 실패");
      setReports(data.records??[]);
      setError("");
    }catch(e){setError(String(e instanceof Error?e.message:e));}
  },[code]);
  useEffect(()=>{if(code) void load();},[code,load]);
  return <main style={{minHeight:"100vh",background:"#080d0a",color:"#f1f5ef",padding:"48px 28px"}}>
    <div style={{maxWidth:1180,margin:"0 auto"}}>
    <Link href={`/admin/scrims/${encodeURIComponent(code)}`} style={{color:"#bfe999"}}>← 팀 배정 관리</Link>
    <h1 style={{margin:"30px 0 8px"}}>{code} · 경기 트래커 관리</h1>
    <p style={{color:"#a6b7a9"}}>팀 확정 후 내전 참가자 1명이 Discord 로그인으로 랭크트레커에 접속할 수 있습니다. 별도 연결키가 필요하지 않습니다.</p>
    <section style={{background:"#0c0c0c",border:"1px solid #303530",padding:24,marginTop:28}}>
      <h2 style={{fontSize:18}}>Discord 인증형 랭크트레커</h2>
      <p style={{fontSize:13,color:"#c4c9c4"}}>랭크트레커를 실행하면 Discord 로그인을 시작합니다. 서버 소속 및 Riot 계정 등록 검증에 성공한 참가자 1명만 내전 코드로 연결합니다.</p>
      <p style={{fontSize:12,color:"#b8ed69"}}>확정된 내전 · 10명 명단 필요 · 결과는 관리자 검토 대기</p>
    </section>
    <section style={{marginTop:32}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2>수집된 세트 결과</h2><button onClick={()=>void load()} style={{padding:"8px 16px"}}>새로고침</button></div>
    {error&&<p role="alert" style={{color:"#ffb6a8"}}>오류: {error}</p>}
    {!reports.length&&<div style={{padding:40,background:"#111813",color:"#a6b7a9"}}>아직 접수된 기록이 없습니다.</div>}
    {reports.map(r=><article key={r.id} style={{background:"#121c15",borderBottom:"1px solid #405346",padding:"18px 22px"}}>
      <strong>{r.afterData.set}세트 · {r.afterData.winner}팀 승리</strong>
      <span style={{marginLeft:20,color:"#a6b7a9",fontSize:12}}>{r.afterData.verifiedBy} · 선수 {r.afterData.players?.length??0}명 · {new Date(r.createdAt).toLocaleString("ko-KR")}</span>
      <p style={{color:"#d6d5a3",fontSize:12}}>상태: 검토 대기 · 랭크/코인 미지급</p>
    </article>)}
    </section></div></main>;
}
