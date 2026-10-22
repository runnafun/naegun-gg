import Link from "next/link";
import TeamBuilder from "./TeamBuilder";
import "./team-builder.css";

export default async function AdminScrimPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const base = `/admin/scrims/${encodeURIComponent(code)}`;
  const sections = [
    {title:"참가자 관리", subtitle:"참가자 추가·제외", href:`${base}/roster`},
    {title:"팀 직접 편집", subtitle:"블루·레드·라인 지정", href:`${base}/teams`},
    {title:"트래커 기록", subtitle:"수집된 세트 확인", href:`${base}/tracker`},
    {title:"기록 없이 강제 종료", subtitle:"트래커 실패·정산 없는 내전 취소", href:`${base}/force-end`},
    {title:"BO3 정산", subtitle:"결과 확인 및 정산", href:`${base}/settlement`},
  ];
  return <main className="team-admin-page ng-scrim-detail">
    <div className="team-admin-shell">
      <header className="ng-admin-head">
        <div><Link className="ng-scrim-back" href="/admin/scrims">← 전체 내전 목록</Link>
          <div className="ng-admin-eyebrow">MATCH MANAGEMENT</div>
          <h1>{code} 내전 관리</h1>
          <p>팀 배정과 참가자·트래커·정산을 한곳에서 관리합니다.</p>
        </div>
      </header>
      <nav className="ng-scrim-actions" aria-label="내전 상세 관리 메뉴">
        {sections.map(item => <Link key={item.href} href={item.href} className="ng-scrim-action">
          <b>{item.title}<span aria-hidden="true"> ↗</span></b><small>{item.subtitle}</small>
        </Link>)}
      </nav>
      <section className="ng-scrim-editor"><div className="ng-admin-panelhead"><h2>자동 팀 배정</h2><span>실제 배정·확정 기능 유지</span></div>
        <div className="ng-scrim-editor-body"><TeamBuilder code={code}/></div>
      </section>
    </div>
  </main>;
}
