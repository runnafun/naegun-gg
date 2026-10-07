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

        <TeamBuilder
          code={code.toUpperCase()}
        />
      </div>
    </main>
  );
}
