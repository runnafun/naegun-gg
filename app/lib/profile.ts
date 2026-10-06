import {
  MOCK_PROFILES,
  MOCK_PROFILE_SEARCH_RESULTS,
  type ProfileData,
  type ProfileSearchResult,
} from "../data/profile";


function normalize(
  value: string
) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}


/* ==================================================
   SEARCH
================================================== */

export function searchProfiles(
  query: string
): ProfileSearchResult[] {

  const keyword =
    normalize(query);

  if (!keyword) {
    return [];
  }


  return MOCK_PROFILE_SEARCH_RESULTS.filter(
    (profile) => {

      const riotId =
        normalize(
          `${profile.gameName}#${profile.tagLine}`
        );

      const gameName =
        normalize(
          profile.gameName
        );

      return (
        riotId.includes(keyword) ||
        gameName.includes(keyword)
      );
    }
  );
}


/* ==================================================
   GET ONE PROFILE
================================================== */

export function getProfileByRiotId(
  gameName: string,
  tagLine: string
): ProfileData | null {

  const normalizedName =
    normalize(gameName);

  const normalizedTag =
    normalize(tagLine);


  return (
    MOCK_PROFILES.find(
      (profile) =>
        normalize(
          profile.gameName
        ) === normalizedName &&
        normalize(
          profile.tagLine
        ) === normalizedTag
    ) ?? null
  );
}