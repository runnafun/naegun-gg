import { rankingUsers } from "../../data/ranking";

export default function RankingTable() {
  return (
    <section className="ranking-table-section">
      <div className="ranking-table-wrap">

        <div className="ranking-table-header">
          <div>순위</div>
          <div>소환사이름</div>
          <div>내전랭크</div>
          <div>탑레이팅</div>
          <div>모스트챔피언</div>
          <div>승률</div>
        </div>

        <div className="ranking-table-body">
          {rankingUsers.map((user) => (
            <div
              className={`ranking-table-row ${
                user.rank <= 3
                  ? `ranking-top ranking-top-${user.rank}`
                  : ""
              }`}
              key={user.rank}
            >
              <div className="ranking-cell ranking-position">
                {user.rank}위
              </div>

              <div className="ranking-cell ranking-summoner">
                <img
                  src={user.profileIcon}
                  alt=""
                  className="ranking-profile-icon"
                />

                <span>
                  {user.summonerName}
                </span>
              </div>

              <div className="ranking-cell ranking-internal-rank">
                {user.internalRank}
              </div>

              <div className="ranking-cell ranking-solo-tier">
                {user.soloTier}
              </div>

              <div className="ranking-cell ranking-most">
                {user.mostChampions.map(
                  (champion, index) => (
                    <img
                      key={`${user.rank}-${index}`}
                      src={champion}
                      alt=""
                      className="ranking-champion-icon"
                    />
                  )
                )}
              </div>

              <div className="ranking-cell ranking-winrate">
                {user.winRate}%
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}