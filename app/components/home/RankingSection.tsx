import { rankingUsers } from "../../data/home";

export default function RankingSection() {
  return (
    <section className="ranking-section">
      <h2 className="section-title">
        내전.GG 랭킹 순위
      </h2>

      <div className="ranking-list">
        {rankingUsers.map((user) => (
          <article
            key={user.rank}
            className={`ranking-card ${
              user.rank === 1 ? "ranking-card-first" : ""
            }`}
            style={{
              backgroundImage: `url("${user.image}")`,
            }}
          >
            <div className="ranking-card-shade" />

            <div className="ranking-number">
              {user.rank}위
            </div>

            <div className="ranking-info">
              <span className="ranking-tier">
                내전랭크&nbsp;
                {user.tier}
              </span>

              <strong className="ranking-nickname">
                {user.nickname}
              </strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}