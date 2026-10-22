import Link from "next/link";
import type { RankingUser } from "../../data/ranking";
import {frameImage} from "@/app/lib/naegun-shop-products";

export default function RankingTable({ users }: { users: RankingUser[] }) {
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
          {users.map((user) => (
            <Link
              href={`/profile-search/result?gameName=${encodeURIComponent(user.gameName)}&tagLine=${encodeURIComponent(user.tagLine)}`}
              aria-label={`${user.summonerName} 프로필 조회`}
              style={{
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
              }}
              className={`ranking-table-row ${
                user.rank <= 3
                  ? `ranking-top ranking-top-${user.rank}`
                  : ""
              }`}
              key={user.puuid}
            >
              <div className="ranking-cell ranking-position">
                {user.rank > 0 ? `${user.rank}위` : "미배치"}
              </div>

              <div className="ranking-cell ranking-summoner">
                <span className="ng-shop-avatar-wrap" style={{width:30,height:30,overflow:'visible'}}><img src={user.profileIcon} alt="" className="ranking-profile-icon"/>{user.frameSku&&frameImage(user.frameSku)&&<img src={frameImage(user.frameSku)!} loading="lazy" alt="" className="ng-shop-frame-deco"/>}</span>

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
                {user.mostChampions.length === 0 && (
                  <span style={{ color: "#aaa" }}>
                    전적 수집 전
                  </span>
                )}
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
                {user.winRate === null ? "0전" : `${user.winRate}%`}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
// NAEGUN_SHOP_V1
