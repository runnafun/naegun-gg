// NAEGUN_BALANCE_V16
"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import type {ReactNode} from "react";
import "./admin-v14.css";
const menu=[
  {group:"운영 현황",items:[["dashboard","대시보드","▦"],["scrims","내전 관리","⌘"],["members","회원 관리","♙"],["balance","티어 평가","◎"],["rewards","보상·재화","◇"]]},
  {group:"서비스 콘텐츠",items:[["banners","이벤트 배너","▧"],["notices","공지·이벤트","▤"],["activity","운영 기록","≡"]]},
  {group:"관리 도구",items:[["admins","관리자 계정","⚙"]]},
];
export default function AdminFrame({children}:{children:ReactNode}){
  const pathname=usePathname();
  const [auth,setAuth]=useState<null|boolean>(null);
  const [name,setName]=useState("");
  const [collapsed,setCollapsed]=useState(false);
  useEffect(()=>{
    let active=true;
    fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json()).then(d=>{
      if(!active)return;
      const u=d?.user;
      setAuth(Boolean(d?.authenticated&&u&&(u.role==="ADMIN"||u.role==="SUPER_ADMIN")));
      setName(u?.username||u?.globalName||"관리자");
    }).catch(()=>{if(active)setAuth(false)});
    return ()=>{active=false};
  },[pathname]);
  const tab=(typeof window!=="undefined"?new URLSearchParams(window.location.search).get("tab"):null)||"dashboard";
  if(auth!==true)return <div className="ng-admin-unauth">{children}</div>;
  return <div className="ng-admin-frame">
    <aside className={`ng-admin-sidebar ${collapsed?"is-closed":""}`}>
      <a className="ng-admin-logo" href="/admin"><span className="ng-admin-logo-box">N</span><span><b>내전.GG</b><small>CONTROL CENTER</small></span></a>
      <nav className="ng-admin-nav">
        {menu.map(group=><div key={group.group} className="ng-admin-navgroup"><div className="ng-admin-navlabel">{group.group}</div>
          {group.items.map(([id,label,glyph])=><a key={id} href={id==="balance"?"/admin/balance":`/admin?tab=${id}`} className={`ng-admin-navitem ${pathname==="/admin/balance"&&id==="balance"?"is-active":pathname==="/admin"&&tab===id?"is-active":""}`}><span className="ng-admin-navicon">{glyph}</span><span>{label}</span></a>)}
        </div>)}
      </nav>
      <div className="ng-admin-sidefoot"><a href="/" target="_blank" rel="noopener noreferrer">↗ 웹사이트 열기</a><small>{name} · 운영자</small></div>
    </aside>
    <div className="ng-admin-right">
      <header className="ng-admin-topbar">
        <button type="button" aria-label="관리 메뉴 접기" className="ng-admin-icon-btn" onClick={()=>setCollapsed(v=>!v)}>☰</button>
        <span>운영 관리자 콘솔</span>
        <div className="ng-admin-topright"><span className="ng-admin-online-dot"/> 데이터베이스 연결 기반</div>
      </header>
      <main className="ng-admin-content">{children}</main>
    </div>
  </div>;
}
