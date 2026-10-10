import type {
  ProfileData,
} from "../../../data/profile";

import ProfileRefreshButton from "./ProfileRefreshButton";


type Props = {
  profile: ProfileData;
};


function rankNumber(
  rank: string,
) {
  const map:
    Record<string, string> = {
      I: "1",
      II: "2",
      III: "3",
      IV: "4",
    };

  return (
    map[
      rank?.toUpperCase()
    ] ?? rank ?? ""
  );
}


export default function ProfileResultHero({
  profile,
}: Props) {
  return (
    <section className="profile-result-hero">

      <div className="profile-result-hero-inner">


        <div className="profile-result-user">

          <div className="profile-result-icon-wrap">

            <img
              src={profile.profileIcon}
              alt=""
              className="profile-result-icon"
            />

            <span className="profile-result-level">
              {profile.level}
            </span>

          </div>


          <div className="profile-result-user-info">

            <div className="profile-result-name-row">

              <h1>
                {profile.gameName}

                <span>
                  #{profile.tagLine}
                </span>
              </h1>


              <button type="button">
                티어평가 요청하기
              </button>

              <ProfileRefreshButton
                gameName={profile.gameName}
                tagLine={profile.tagLine}
              />

            </div>


            <p>
              내전.GG에 등록된 소환사입니다.
            </p>

          </div>

        </div>


        <div className="profile-result-ratings">


          <div className="profile-result-rating">

            <strong>
              내전랭크
            </strong>

            <img
              src={
                profile.internalRankImage
              }
              alt=""
              className="profile-result-internal-rank"
            />

            <span>
              {profile.internalScore}
            </span>

          </div>


          <div className="profile-result-rating">

            <strong>
              탑레이팅
            </strong>

            <img
              src={
                profile.soloTierImage
              }
              alt=""
            />

            <span>
              {profile.soloTier}
              {" "}
              {profile.soloLp}LP
            </span>

          </div>


          <div className="profile-result-rating">

            <strong>
              현재 티어
            </strong>

            <img
              src={
                profile.soloTierImage
              }
              alt=""
            />

            <span>
              {profile.soloTier}
              {" "}
              {rankNumber(
                profile.soloRank
              )}
              {" · "}
              {profile.soloLp}
              LP
            </span>

          </div>


        </div>

      </div>

    </section>
  );
}