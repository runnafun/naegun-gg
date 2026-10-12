import {
  SOLO_TIER_IMAGES,
  type ProfileData,
  type SoloTierKey,
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



const TIER_NAMES: Record<string, string> = {
  IRON: "아이언",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  EMERALD: "에메랄드",
  DIAMOND: "다이아몬드",
  MASTER: "마스터",
  GRANDMASTER: "그랜드마스터",
  CHALLENGER: "챌린저",
};

const DIVISIONS = ["IV", "III", "II", "I"];

const TIERS: SoloTierKey[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
];

function evaluationRank(profile: ProfileData) {
  const bonus = profile.tierEvaluationRp;
  const currentTier = profile.soloTierKey;

  const divisionIndex = DIVISIONS.indexOf(
    profile.soloRank?.toUpperCase() ?? "",
  );

  const tierIndex = TIERS.indexOf(currentTier);

  const baseName =
    TIER_NAMES[currentTier] ?? profile.soloTier;

  // 언랭크 및 마스터 이상은 별도 승강급 기준 유지
  if (
    tierIndex < 0 ||
    tierIndex >= 7 ||
    divisionIndex < 0
  ) {
    return {
      label: profile.soloTier === "UNRANKED"
        ? "언랭크"
        : baseName,
      image: profile.soloTierImage,
      bonus,
    };
  }

  // 각 디비전은 100LP
  // 현재 LP + 승인된 평가 RP로 표시 디비전 계산
  const totalLp = Math.max(
    0,
    tierIndex * 400 +
      divisionIndex * 100 +
      Math.max(0, profile.soloLp) +
      bonus,
  );

  const evaluatedTierIndex = Math.min(
    7,
    Math.floor(totalLp / 400),
  );

  const evaluatedTier = TIERS[evaluatedTierIndex];

  const evaluatedDivision = Math.floor(
    (totalLp % 400) / 100,
  );

  return {
    label:
      evaluatedTierIndex === 7
        ? "마스터"
        : `${TIER_NAMES[evaluatedTier]} ${4 - evaluatedDivision}`,

    image: SOLO_TIER_IMAGES[evaluatedTier],
    bonus,
  };
}

export default function ProfileResultHero({
  profile,
}: Props) {
  const evaluated = evaluationRank(profile);

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
            <strong>내전랭크</strong>

            <img
              src={profile.internalRankImage}
              alt=""
              className="profile-result-internal-rank"
            />

            <span>{profile.internalScore}</span>
          </div>

          <div className="profile-result-rating profile-result-evaluation">
            <strong>티어평가도</strong>
            <img src={profile.evaluationTierImage ?? profile.soloTierImage} alt="" />
            <span>{profile.evaluationTierLabel ?? "평가 정보 없음"}</span>
            <small className="profile-result-evaluation-offset">
              관리자 보정 {Number(profile.evaluationLpOffset ?? 0) >= 0 ? "+" : ""}{profile.evaluationLpOffset ?? 0}LP
            </small>
          </div>

          <div className="profile-result-rating">
            <strong>현재 티어</strong>

            <img
              src={profile.soloTierImage}
              alt=""
            />

            <span>
              {profile.soloTier === "UNRANKED"
                ? "언랭크"
                : TIER_NAMES[profile.soloTierKey] ?? profile.soloTier}
              {profile.soloRank
                ? ` ${rankNumber(profile.soloRank)}`
                : ""}
              {" · "}{profile.soloLp}LP
            </span>
          </div>

        </div>

      </div>

    </section>
  );
}