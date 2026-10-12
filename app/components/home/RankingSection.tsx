import Link from "next/link";
import type { HomeRankingUser } from "../../lib/home-ranking";

export default function RankingSection({
  users,
}: {
  users: HomeRankingUser[];
}) {
  return (
    <section className="ranking-section">
      <h2 className="section-title">
        내전.GG 랭킹 순위
      </h2>

      <div className="ranking-list">
        {users.map((user) => (
          <Link
            key={user.puuid}
            href={`/profile-search/result?gameName=${encodeURIComponent(user.gameName)}&tagLine=${encodeURIComponent(user.tagLine)}`}
            aria-label={`${user.gameName}#${user.tagLine} 프로필 조회`}
            className={`ranking-card ${
              user.rank === 1
                ? "ranking-card-first"
                : ""
            }`}
            style={{
              backgroundImage: `url("${user.avatarUrl}")`,
            }}
          >
            <div className="ranking-card-shade" />

            <div className="ranking-number">
              {user.rank}위
            </div>

            <div className="ranking-info">
              <span className="ranking-tier">
                내전랭크&nbsp;{user.tier}
              </span>

              <strong className="ranking-nickname">
                {user.gameName}
              </strong>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
