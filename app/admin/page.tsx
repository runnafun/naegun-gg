// NAEGUN_RIOT_ADMIN_V15
// NAEGUN_ADMIN_V14
"use client";
import {FormEvent,useCallback,useEffect,useRef,useState} from "react";
type User={id:string;username:string;role:string};
type Member={id:string;role:string;status:string;discordAccount?:{username:string;globalName:string|null;discordUserId:string}|null;riotAccount?:{gameName:string;tagLine:string;soloTier:string|null;soloRank:string|null}|null;stats?:{tierScore:number;wins:number;losses:number}|null;defenseStats?:{progress:number;tickets:number}|null;wallet?:{balance:string}|null};
type Scrim={id:string;code:string;type:string;status:string;startAt:string;createdAt:string;_count?:{participants:number}};
type Banner={id:string;title:string;url:string;enabled:boolean;openNewTab:boolean;position:number;imageUrl:string};
type Notice={id:string;title:string;createdAt:string};
type Log={id:string;action:string;targetType:string;targetId:string|null;reason:string|null;createdAt:string;adminName?:string};
type Overview={stats?:Record<string,number>;scrims?:Scrim[];logs?:Log[];notices?:Notice[]};
type Account={id:string;username:string;role:string;status:string};
const TABS:Record<string,{title:string;intro:string}>={
 dashboard:{title:"운영 대시보드",intro:"지금 처리해야 할 일과 서비스 상태를 한눈에 확인합니다."},
 scrims:{title:"내전 관리",intro:"전체 모집·마감·팀 편성·BO3 정산과 트래커 상태를 관리합니다."},
 members:{title:"회원 관리",intro:"Discord·Riot 계정 연결 및 내전랭크·보유 재화를 조회합니다."},
 rewards:{title:"보상·재화",intro:"회원 여러 명을 선택해 랭크 방패·보호권·GG코인을 일괄 조정합니다."},
 banners:{title:"메인 이벤트 배너",intro:"업로드한 이미지와 링크를 메인 페이지에 즉시 반영합니다."},
 notices:{title:"공지·이벤트",intro:"Discord에서 동기화된 공지사항 및 공개 상태를 확인합니다."},
 activity:{title:"운영 기록",intro:"관리자 변경, 보상 지급, 경기 정산 내역을 추적합니다."},
 admins:{title:"관리자 계정",intro:"권한과 관리자 로그인 계정을 관리합니다."},
};
const choices=[{id:"SHIELD_ADD",label:"랭크 방패 +1"},{id:"SHIELD_SUB",label:"랭크 방패 -1"},{id:"TICKET_ADD",label:"보호권 +1"},{id:"TICKET_SUB",label:"보호권 -1"},{id:"PROGRESS_ADD",label:"보호 게이지 +%"},{id:"COINS_ADD",label:"GG코인 지급"},{id:"COINS_SUB",label:"GG코인 차감"},{id:"WIN_ADD",label:"승리 기록 +1"},{id:"LOSS_ADD",label:"패배 기록 +1"}];
async function requestJSON(url:string,init?:RequestInit){const res=await fetch(url,{cache:"no-store",...init});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);return data;}
const jsonOpts=(method:string,data:unknown):RequestInit=>({method,headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
const formatDate=(s:string)=>{try{return new Date(s).toLocaleString("ko-KR");}catch{return s;}};

export default function AdminPage(){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 const [tab,setTab]=useState("dashboard"),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [username,setUsername]=useState(""),[password,setPassword]=useState("");
 const [overview,setOverview]=useState<Overview>({}),[members,setMembers]=useState<Member[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[query,setQuery]=useState("");
 const [riotTarget,setRiotTarget]=useState<Member|null>(null);
 const [riotGameName,setRiotGameName]=useState("");
 const [riotTagLine,setRiotTagLine]=useState("");
 const [riotReason,setRiotReason]=useState("");
 const [riotNextAllowed,setRiotNextAllowed]=useState("");
 const [riotWorking,setRiotWorking]=useState(false);
 const [selected,setSelected]=useState<string[]>([]),[operation,setOperation]=useState("SHIELD_ADD"),[amount,setAmount]=useState(1),[reason,setReason]=useState(""),[busy,setBusy]=useState(false);
 const rewardIdRef=useRef("");
 useEffect(()=>{rewardIdRef.current="";},[selected.join(","),operation,amount,reason]);
 const [banners,setBanners]=useState<Banner[]>([]),[editId,setEditId]=useState(""),[bannerTitle,setBannerTitle]=useState(""),[bannerUrl,setBannerUrl]=useState(""),[bannerPosition,setBannerPosition]=useState(0),[bannerEnabled,setBannerEnabled]=useState(true),[bannerNewTab,setBannerNewTab]=useState(false),[bannerFile,setBannerFile]=useState<File|null>(null),[preview,setPreview]=useState("");
 const [logs,setLogs]=useState<Log[]>([]),[accounts,setAccounts]=useState<Account[]>([]),[newAdmin,setNewAdmin]=useState(""),[newPass,setNewPass]=useState("");
 useEffect(()=>{
  setTab(new URLSearchParams(window.location.search).get("tab")||"dashboard");
  requestJSON("/api/auth/me").then(d=>{if(d.authenticated&&["ADMIN","SUPER_ADMIN"].includes(d.user?.role))setUser(d.user);}).catch(()=>{}).finally(()=>setLoading(false));
 },[]);
 const refreshOverview=useCallback(async()=>{setOverview(await requestJSON("/api/admin/console/overview"));},[]);
 const refreshMembers=useCallback(async(q=query,p=page)=>{const d=await requestJSON(`/api/admin/console/members?q=${encodeURIComponent(q)}&page=${p}`);setMembers(d.items||[]);setTotal(d.total||0);setPage(p);},[query,page]);
 const refreshBanners=useCallback(async()=>{const d=await requestJSON("/api/admin/console/banners");setBanners(d.banners||[]);},[]);
 const refreshLogs=useCallback(async()=>{const d=await requestJSON("/api/admin/console/activity");setLogs(d.items||[]);},[]);
 const refreshAdmins=useCallback(async()=>{const d=await requestJSON("/api/admin/accounts");setAccounts(d.accounts||[]);},[]);
 useEffect(()=>{
  if(!user)return;
  setError("");
  const load=tab==="dashboard"||tab==="scrims"||tab==="notices"?refreshOverview:tab==="members"||tab==="rewards"?()=>refreshMembers("",1):tab==="banners"?refreshBanners:tab==="activity"?refreshLogs:tab==="admins"?refreshAdmins:null;
  load?.().catch(e=>setError(String(e.message||e)));
 },[user,tab,refreshOverview,refreshBanners,refreshLogs,refreshAdmins]);
 async function login(e:FormEvent){e.preventDefault();setError("");try{await requestJSON("/api/admin/login",jsonOpts("POST",{username,password}));window.location.reload();}catch(e){setError((e as Error).message);}}
 async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.location.href="/admin";}
 async function openRiotAdmin(member:Member){
  setRiotTarget(member);setRiotGameName(member.riotAccount?.gameName||"");setRiotTagLine(member.riotAccount?.tagLine||"");setRiotReason("");setRiotNextAllowed("조회 중...");setError("");setNotice("");
  try{const d=await requestJSON(`/api/admin/console/riot-account?userId=${encodeURIComponent(member.id)}`);setRiotNextAllowed(d.account?new Date(d.account.nextAllowedAt).toLocaleString("ko-KR"):"Riot 계정 미연동");}
  catch(e){setRiotNextAllowed("조회 오류");setError((e as Error).message)}
 }
 async function submitRiotAdmin(action:"CHANGE_ACCOUNT"|"RESET_COOLDOWN"){
  if(!riotTarget)return;
  if(riotReason.trim().length<5)return setError("작업 사유를 5자 이상 입력해 주세요.");
  const label=action==="CHANGE_ACCOUNT"?`Riot 계정을 ${riotGameName}#${riotTagLine.replace(/^#/,"")}로 변경`:`30일 계정 변경 제한 해제`;
  if(!confirm(`${riotTarget.discordAccount?.globalName||riotTarget.discordAccount?.username||riotTarget.id} 회원의 ${label} 작업을 실행할까요?\n사유: ${riotReason}\n작업 기록은 관리자 감사 로그에 남습니다.`))return;
  setRiotWorking(true);setError("");setNotice("");
  try{const d=await requestJSON("/api/admin/console/riot-account",jsonOpts("POST",{userId:riotTarget.id,action,gameName:riotGameName,tagLine:riotTagLine,reason:riotReason}));
    setNotice(d.message||"변경 완료");await refreshMembers(query,page);
    if(action==="CHANGE_ACCOUNT")setRiotTarget(null);
    else{const s=await requestJSON(`/api/admin/console/riot-account?userId=${encodeURIComponent(riotTarget.id)}`);setRiotNextAllowed(new Date(s.account.nextAllowedAt).toLocaleString("ko-KR"));}
  }catch(e){setError((e as Error).message)}finally{setRiotWorking(false)}
 }
 const search=async(e:FormEvent)=>{e.preventDefault();setError("");setSelected([]);try{await refreshMembers(query,1)}catch(e){setError((e as Error).message)}};
 const selectAll=()=>{const pageIds=members.map(x=>x.id);setSelected(ids=>pageIds.every(x=>ids.includes(x))?ids.filter(x=>!pageIds.includes(x)):[...new Set([...ids,...pageIds])].slice(0,30));};
 const sendReward=async()=>{
  if(!selected.length)return setError("먼저 회원을 선택해 주세요.");
  if(reason.trim().length<5)return setError("보상 조정 사유를 5자 이상 입력해 주세요.");
  if(!confirm(`${selected.length}명에게 '${choices.find(x=>x.id===operation)?.label}' 작업을 실행합니다.\n사유: ${reason}\n\n승인하면 실제 RDS 데이터가 변경됩니다. 계속할까요?`))return;
  setBusy(true);setError("");setNotice("");
  try{rewardIdRef.current ||= crypto.randomUUID();const res=await requestJSON("/api/admin/console/rewards",jsonOpts("POST",{operationId:rewardIdRef.current,userIds:selected,operation,amount,reason}));setNotice(res.duplicate?"이미 처리한 요청입니다.":`${res.updated}명에게 조정 적용 완료 · 감사 로그 기록`);rewardIdRef.current="";setSelected([]);await refreshMembers(query,1)}catch(e){setError((e as Error).message)}finally{setBusy(false)};
 };
 const resetBanner=()=>{setEditId("");setBannerTitle("");setBannerUrl("");setBannerPosition(0);setBannerEnabled(true);setBannerNewTab(false);setBannerFile(null);setPreview("");};
 const editBanner=(b:Banner)=>{setEditId(b.id);setBannerTitle(b.title);setBannerUrl(b.url);setBannerPosition(b.position);setBannerEnabled(b.enabled);setBannerNewTab(b.openNewTab);setBannerFile(null);setPreview(b.imageUrl);};
 async function saveBanner(e:FormEvent){e.preventDefault();setError("");setNotice("");setBusy(true);
  try{const data=new FormData();data.set("title",bannerTitle);data.set("url",bannerUrl);data.set("position",String(bannerPosition));data.set("enabled",String(bannerEnabled));data.set("openNewTab",String(bannerNewTab));if(editId)data.set("id",editId);if(bannerFile)data.set("image",bannerFile);
   await requestJSON("/api/admin/console/banners",{method:editId?"PATCH":"POST",body:data});setNotice(editId?"배너 수정 완료":"배너 등록 완료");resetBanner();await refreshBanners();
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function removeBanner(b:Banner){if(!confirm(`'${b.title}' 배너를 삭제할까요? 복구할 수 없습니다.`))return;setBusy(true);try{await requestJSON("/api/admin/console/banners",jsonOpts("DELETE",{id:b.id}));setNotice("배너 삭제 완료");resetBanner();await refreshBanners()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function createAdmin(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{await requestJSON("/api/admin/accounts",jsonOpts("POST",{username:newAdmin,password:newPass}));setNotice("관리자 계정 생성 완료");setNewAdmin("");setNewPass("");await refreshAdmins()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 if(loading)return <section className="ng-admin-wait">관리자 인증 확인 중…</section>;
 if(!user)return <main className="ng-admin-login"><form onSubmit={login} className="ng-admin-loginbox"><span className="ng-admin-eyebrow">NAEGUN.GG CONTROL CENTER</span><h1>관리자 로그인</h1><p>인가된 운영 계정만 접속할 수 있습니다.</p><label>관리자 ID<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>비밀번호<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p className="ng-admin-error">{error}</p>}<button type="submit" className="ng-admin-primary">로그인</button><a href="/">← 메인으로 돌아가기</a></form></main>;
 const here=TABS[tab]||TABS.dashboard;
 return <div className="ng-admin-dashboard"><div className="ng-admin-head"><div><div className="ng-admin-eyebrow">ADMINISTRATION / {tab.toUpperCase()}</div><h1>{here.title}</h1><p>{here.intro}</p></div><div className="ng-admin-head-actions"><button type="button" className="ng-admin-outline" onClick={()=>window.location.reload()}>↻ 새로고침</button><button type="button" className="ng-admin-outline" onClick={logout}>로그아웃</button></div></div>
 {error&&<div role="alert" className="ng-admin-error">⚠ {error}<button onClick={()=>setError("")}>✕</button></div>}
 {notice&&<div role="status" className="ng-admin-success">✓ {notice}<button onClick={()=>setNotice("")}>✕</button></div>}
 {(tab==="dashboard")&&<>
  <div className="ng-admin-kpis">{[["등록 회원",overview.stats?.registered],["모집 중",overview.stats?.open],["팀 편성 대기",overview.stats?.selection],["경기 진행",overview.stats?.running],["종료 경기",overview.stats?.finished],["공개 공지",overview.stats?.notices]].map(([label,value])=><div className="ng-admin-kpi" key={String(label)}><span>{label}</span><strong>{value??"—"}</strong></div>)}</div>
  <div className="ng-admin-columns"><section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>최근 내전</h2><a href="/admin?tab=scrims">전체 보기 ↗</a></div><ScrimRows items={overview.scrims||[]}/></section><section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>최근 운영 내역</h2><a href="/admin?tab=activity">작업 로그 ↗</a></div><LogRows items={(overview.logs||[]).slice(0,8)}/></section></div>
 </>}
 {tab==="scrims"&&<section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>최근 내전 운영</h2><a href="/admin/scrims">전체 내전 검색 ↗</a></div><p className="ng-admin-hint">내전 코드를 선택하면 팀 편집·트래커·수동 BO3 정산을 진행할 수 있습니다. 이미 정산된 경기는 중복 정산하지 마세요.</p><ScrimRows items={overview.scrims||[]}/></section>}
 {(tab==="members"||tab==="rewards")&&<>
  <section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>회원 찾기 <small>{total.toLocaleString()}명</small></h2><span>현재 페이지 최대 30명 선택 가능</span></div>
   <form onSubmit={search} className="ng-admin-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Riot 닉네임, Discord 이름 또는 Discord ID 검색"/><button type="submit" className="ng-admin-primary">검색</button></form>
   <div className="ng-admin-scroll"><table className="ng-admin-table"><thead><tr><th><input type="checkbox" aria-label="현재 페이지 선택" checked={members.length>0&&members.every(x=>selected.includes(x.id))} onChange={selectAll}/></th><th>회원</th><th>내전 점수</th><th>전적</th><th>보호 게이지</th><th>보호권</th><th>GG코인</th><th>상태</th><th>라이엇 계정</th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td><input type="checkbox" checked={selected.includes(m.id)} onChange={e=>setSelected(s=>e.target.checked?[...s,m.id].slice(0,30):s.filter(id=>id!==m.id))}/></td><td><b>{m.riotAccount?`${m.riotAccount.gameName}#${m.riotAccount.tagLine}`:"Riot 미연동"}</b><small>{m.discordAccount?.globalName||m.discordAccount?.username||"Discord 미연동"}</small></td><td>{m.stats?.tierScore??0}</td><td>{m.stats?.wins??0}승 {m.stats?.losses??0}패</td><td>{m.defenseStats?.progress??0}%</td><td>{m.defenseStats?.tickets??0}</td><td>{Number(m.wallet?.balance||0).toLocaleString()}</td><td><span className="ng-admin-status">{m.status}</span></td><td><button type="button" className="ng-admin-outline" onClick={()=>openRiotAdmin(m)}>계정 관리</button></td></tr>)}</tbody></table></div>
   <div className="ng-admin-paging"><span>선택 {selected.length}명 · {page} / {Math.max(1,Math.ceil(total/30))}페이지</span><div><button disabled={page<=1} onClick={()=>refreshMembers(query,page-1).catch(e=>setError(e.message))}>이전</button><button disabled={page*30>=total} onClick={()=>refreshMembers(query,page+1).catch(e=>setError(e.message))}>다음</button></div></div>
  </section>
  {tab==="members"&&riotTarget&&<section className="ng-admin-panel" style={{border:"1px solid #53635b"}}>
   <div className="ng-admin-panelhead"><h2>Riot 계정 관리</h2><button type="button" onClick={()=>setRiotTarget(null)}>닫기 ✕</button></div>
   <p className="ng-admin-hint"><b>{riotTarget.discordAccount?.globalName||riotTarget.discordAccount?.username||"회원"}</b> · 현재 계정: {riotTarget.riotAccount?`${riotTarget.riotAccount.gameName}#${riotTarget.riotAccount.tagLine}`:"미연동"}</p>
   <p className="ng-admin-hint">다음 일반 변경 가능 시각: {riotNextAllowed}</p>
   <div className="ng-admin-formgrid">
    <label>변경할 Riot 소환사 이름<input value={riotGameName} onChange={e=>setRiotGameName(e.target.value)} placeholder="소환사 이름" maxLength={32}/></label>
    <label>태그 (# 제외)<input value={riotTagLine} onChange={e=>setRiotTagLine(e.target.value)} placeholder="KR1" maxLength={16}/></label>
    <label className="ng-admin-wide">변경 사유 (필수)<input value={riotReason} onChange={e=>setRiotReason(e.target.value)} placeholder="예: 회원 계정 변경 요청" maxLength={200}/></label>
   </div>
   <div className="ng-admin-actionrow"><p>30일 해제는 PUUID를 변경하지 않습니다. 직접 변경은 Riot API로 실제 계정을 확인하며 진행 중 내전 참가자는 변경할 수 없습니다.</p>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="button" disabled={riotWorking} className="ng-admin-outline" onClick={()=>submitRiotAdmin("RESET_COOLDOWN")}>30일 제한 해제</button>
    <button type="button" disabled={riotWorking} className="ng-admin-primary" onClick={()=>submitRiotAdmin("CHANGE_ACCOUNT")}>관리자 직접 변경</button></div>
   </div>
   <p className="ng-admin-hint">직접 변경 이후 Bot-Hosting의 기존 등록 계정은 별도로 동기화가 필요할 수 있습니다. 기존 BO3 기록과 보상은 유지됩니다.</p>
  </section>}
  {(tab==="rewards"||selected.length>0)&&<section className="ng-admin-panel ng-admin-actionpanel"><div className="ng-admin-panelhead"><h2>선택 회원 일괄 조정</h2><span>총 {selected.length}명 선택</span></div><div className="ng-admin-formgrid"><label>조정 항목<select value={operation} onChange={e=>setOperation(e.target.value)}>{choices.map(c=><option value={c.id} key={c.id}>{c.label}</option>)}</select></label>{["COINS_ADD","COINS_SUB","PROGRESS_ADD"].includes(operation)&&<label>수량<input type="number" min="1" max={operation==="PROGRESS_ADD"?100:100000} value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label>}<label className="ng-admin-wide">조정 사유 (필수)<input value={reason} onChange={e=>setReason(e.target.value)} maxLength={200} placeholder="예: R006 보상 누락 보정 / 관리자 요청"/></label></div><div className="ng-admin-actionrow"><p>수정 전에 승패·방패·코인 내역을 확인하세요. 동일 요청은 중복 처리되지 않습니다.</p><button className="ng-admin-primary" disabled={busy||!selected.length} onClick={sendReward}>선택 {selected.length}명 변경 확인 →</button></div></section>}
 </>}
 {tab==="banners"&&<div className="ng-admin-columns ng-admin-columns-banner"><section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>등록된 메인 배너</h2><span>활성화한 배너만 메인에 표시</span></div><div className="ng-admin-bannerlist">{banners.map(b=><div className="ng-admin-bannerrow" key={b.id}><img src={b.imageUrl} alt={b.title}/><div><b>{b.title}</b><small>{b.url}</small><small>{b.enabled?"● 공개":"○ 숨김"} · 순서 {b.position}</small></div><div className="ng-admin-banneractions"><button onClick={()=>editBanner(b)}>편집</button><button onClick={()=>removeBanner(b)} disabled={busy}>삭제</button></div></div>)}{!banners.length&&<div className="ng-admin-empty">등록된 배너가 없습니다. 오른쪽에서 이미지를 등록해 주세요.</div>}</div></section>
  <section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>{editId?"배너 수정":"새 배너 등록"}</h2>{editId&&<button onClick={resetBanner}>+ 새로 등록</button>}</div><form className="ng-admin-bannerform" onSubmit={saveBanner}><div className="ng-admin-bannerpreview">{preview?<img src={preview} alt="배너 미리보기"/>:<span>이미지 미리보기<br/><small>PNG / JPG / WEBP · 3MB 이하</small></span>}</div><label>배너 이미지<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0]||null;setBannerFile(f);if(f){const reader=new FileReader();reader.onload=()=>setPreview(String(reader.result));reader.readAsDataURL(f)}}}/></label><label>배너 이름<input required maxLength={120} value={bannerTitle} onChange={e=>setBannerTitle(e.target.value)} placeholder="예: 내전 시즌 오픈"/></label><label>클릭 시 이동할 링크<input required value={bannerUrl} onChange={e=>setBannerUrl(e.target.value)} placeholder="/ranking 또는 https://example.com"/></label><label>노출 순서<input type="number" min={0} max={10000} value={bannerPosition} onChange={e=>setBannerPosition(Number(e.target.value))}/></label><div className="ng-admin-checkrow"><label><input type="checkbox" checked={bannerEnabled} onChange={e=>setBannerEnabled(e.target.checked)}/> 사이트 공개</label><label><input type="checkbox" checked={bannerNewTab} onChange={e=>setBannerNewTab(e.target.checked)}/> 새 탭에서 열기</label></div><button type="submit" className="ng-admin-primary" disabled={busy}>{editId?"배너 수정 저장":"배너 등록"}</button></form></section>
 </div>}
 {tab==="notices"&&<section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>공개된 Discord 연동 공지</h2><a href="/notice" target="_blank">게시판 열기 ↗</a></div><p className="ng-admin-hint">기존 Discord 포럼 동기화는 유지합니다. 메인 공지 목록에는 공개된 최신 글이 연결됩니다.</p><div className="ng-admin-list">{(overview.notices||[]).map(n=><a href="/notice" className="ng-admin-rowlink" key={n.id}><b>{n.title}</b><small>{formatDate(n.createdAt)}</small></a>)}</div></section>}
 {tab==="activity"&&<section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>최근 작업 기록</h2><span>최근 100건 · 최신순</span></div><LogRows items={logs}/></section>}
 {tab==="admins"&&<section className="ng-admin-panel"><div className="ng-admin-panelhead"><h2>관리자 계정</h2><span>최고 관리자만 새 계정을 생성할 수 있습니다.</span></div><div className="ng-admin-list">{accounts.map(a=><div className="ng-admin-rowlink" key={a.id}><b>{a.username}</b><small>{a.role} · {a.status}</small></div>)}</div>{user.role==="SUPER_ADMIN"&&<form className="ng-admin-adminform" onSubmit={createAdmin}><h3>새 관리자 계정</h3><input placeholder="관리자 ID" value={newAdmin} onChange={e=>setNewAdmin(e.target.value)} required/><input placeholder="비밀번호 (8자 이상)" type="password" minLength={8} value={newPass} onChange={e=>setNewPass(e.target.value)} required/><button className="ng-admin-primary" disabled={busy} type="submit">관리자 추가</button></form>}</section>}
 </div>
}
function ScrimRows({items}:{items:Scrim[]}){return <div className="ng-admin-scroll"><table className="ng-admin-table"><thead><tr><th>내전 코드</th><th>종류</th><th>상태</th><th>인원</th><th>시작 예정</th><th>관리</th></tr></thead><tbody>{items.map(s=><tr key={s.id}><td><b>{s.code}</b></td><td>{s.type==="RANKED"?"랭크":"일반"}</td><td><span className="ng-admin-status">{s.status}</span></td><td>{s._count?.participants??"—"}</td><td>{formatDate(s.startAt)}</td><td className="ng-admin-actions"><a href={`/admin/scrims/${s.code}`}>관리</a><a href={`/admin/scrims/${s.code}/teams`}>팀</a><a href={`/admin/scrims/${s.code}/settlement`}>정산</a></td></tr>)}{!items.length&&<tr><td colSpan={6}>표시할 내전이 없습니다.</td></tr>}</tbody></table></div>}
function LogRows({items}:{items:Log[]}){return <div className="ng-admin-list">{items.map(l=><div className="ng-admin-logrow" key={l.id}><span className="ng-admin-logaction">{l.action}</span><div><b>{l.targetType} {l.targetId?.slice(0,10)||""}</b><small>{l.reason||l.adminName||"작업 기록"}</small></div><time>{formatDate(l.createdAt)}</time></div>)}{!items.length&&<div className="ng-admin-empty">기록이 없습니다.</div>}</div>}
