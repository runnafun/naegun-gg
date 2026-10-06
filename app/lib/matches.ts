import {
  MOCK_MATCHES,
  MOCK_MATCH_SEARCH_RESULTS,
  type MatchLookupData,
  type MatchSearchResult,
} from "../data/matches";


/* ==================================================
   NORMALIZE
================================================== */

function normalizeMatchCode(
  value: string
) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}


/* ==================================================
   SEARCH MATCHES

   현재는 MOCK_MATCH_SEARCH_RESULTS 사용

   나중에 실제 API / DB 연동 시
   이 함수 내부만 변경하면 됨
================================================== */

export function searchMatchLookups(
  query: string
): MatchSearchResult[] {
  const keyword =
    normalizeMatchCode(
      query
    );


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


/* ==================================================
   GET MATCH BY CODE

   현재는 MOCK_MATCHES 사용

   중요:
   app/data/matches.ts를
   단일 데이터 소스로 사용
================================================== */

export function getMatchLookupByCode(
  code: string
): MatchLookupData | null {
  const normalizedCode =
    normalizeMatchCode(
      code
    );


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