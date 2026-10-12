import TeamBuilder from "./TeamBuilder";
import "./team-builder.css";

export default async function AdminScrimPage({
  params,
}: {
  params: Promise<{
    code: string;
  }>;
}) {
  const { code } = await params;

  return (
    <main className="team-admin-page">
      <div className="team-admin-shell">
        <div className="team-admin-head">
          <div>
            <p className="team-admin-kicker">
              내전.GG ADMIN
            </p>
            <h1>
              {code.toUpperCase()} 팀 배정
            </h1>
          </div>
        </div>

        <a href={`/admin/scrims/${encodeURIComponent(code)}/tracker`}
          style={{display:"inline-block",margin:"14px 0 25px",padding:"12px 20px",border:"1px solid #4f6b50",color:"#c7edb8"}}>
          경기 트래커 연결 및 수집 현황 →
        </a>
        <a href={`/admin/scrims/${code.toUpperCase()}/roster`} style={{ display: "inline-block", color: "#cde3c9", margin: "14px 0", padding: "10px 16px", border: "1px solid #3a4c3f", borderRadius: 8, textDecoration: "none", background: "#18231b" }}>참가자 관리 · 추가/제외</a>
        <a href={`/admin/scrims/${code.toUpperCase()}/teams`} style={{ display: "inline-block", color: "#d8ead4", margin: "12px 0", padding: "10px 16px", border: "1px solid #49614d", borderRadius: 7, background: "#202d23", textDecoration: "none" }}>팀 자유 편집 · 블루/레드 이동 · 라인 변경</a>
        <TeamBuilder
          code={code.toUpperCase()}
        />
      </div>
    </main>
  );
}
