import {
  MOCK_MATCHES,
  MOCK_MATCH_SEARCH_RESULTS,
  type MatchLookupData,
  type MatchSearchResult,
} from "../data/matches";


function normalizeMatchCode(
  value: string
) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}


export function searchMatchLookups(
  query: string
): MatchSearchResult[] {
  const keyword =
    normalizeMatchCode(query);


  if (!keyword) {
    return [];
  }


  return MOCK_MATCH_SEARCH_RESULTS.filter(
    (match) =>
      normalizeMatchCode(
        match.code
      ).includes(
        keyword
      )
  );
}


export function getMatchLookupByCode(
  code: string
): MatchLookupData | null {
  const normalizedCode =
    normalizeMatchCode(code);


  return (
    MOCK_MATCHES.find(
      (match) =>
        normalizeMatchCode(
          match.code
        ) ===
        normalizedCode
    ) ?? null
  );
}