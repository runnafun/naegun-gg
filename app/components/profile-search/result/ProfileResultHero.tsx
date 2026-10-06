import type {
  ProfileData,
} from "../../../data/profile";


type Props = {
  profile: ProfileData;
};


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

              <button type="button">
                전적 갱신하기
              </button>

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
              티어평가도
            </strong>

            <img
              src={
                profile.peakTierImage
              }
              alt=""
            />

            <span>
              {profile.peakTier}
              {" +"}
              {profile.peakLp}
            </span>

          </div>


        </div>

      </div>

    </section>
  );
}