"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  MatchSearchResult,
} from "../../data/matches";

import styles from
  "./MatchSearchInput.module.css";


type Props = {
  defaultValue?: string;

  variant?:
    | "hero"
    | "topbar";
};


export default function MatchSearchInput({
  defaultValue = "",
  variant = "hero",
}: Props) {
  const router =
    useRouter();


  const [
    query,
    setQuery,
  ] = useState(
    defaultValue
  );


  const [
    results,
    setResults,
  ] = useState<
    MatchSearchResult[]
  >([]);


  const [
    focused,
    setFocused,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  useEffect(() => {
    const cleanQuery =
      query.trim();


    if (!cleanQuery) {
      setResults([]);
      setLoading(false);

      return;
    }


    const timer =
      window.setTimeout(
        async () => {
          try {
            setLoading(true);


            const response =
              await fetch(
                `/api/matches/search?q=${encodeURIComponent(
                  cleanQuery
                )}`
              );


            if (!response.ok) {
              setResults([]);

              return;
            }


            const data =
              await response.json();


            setResults(
              data.results ?? []
            );
          } catch {
            setResults([]);
          } finally {
            setLoading(false);
          }
        },
        180
      );


    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [query]);


  const openMatch = (
    match: MatchSearchResult
  ) => {
    const params =
      new URLSearchParams({
        code:
          match.code,
      });


    router.push(
      `/matches/result?${params.toString()}`
    );
  };


  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();


    if (
      results.length > 0
    ) {
      openMatch(
        results[0]
      );
    }
  };


  return (
    <form
      className={[
        styles.form,

        variant === "hero"
          ? styles.hero
          : styles.topbar,
      ].join(" ")}
      onSubmit={
        handleSubmit
      }
    >

      <div className={styles.inputWrap}>

        <input
          type="text"
          value={query}
          onChange={
            (event) =>
              setQuery(
                event.target.value
              )
          }
          onFocus={() =>
            setFocused(true)
          }
          onBlur={() =>
            window.setTimeout(
              () =>
                setFocused(false),
              150
            )
          }
          placeholder="EX) N103"
          autoComplete="off"
          className={
            styles.input
          }
        />

      </div>


      {focused && (
        <div
          className={
            styles.dropdown
          }
        >

          {!query.trim() && (
            <div
              className={
                styles.guide
              }
            >

              <p>
                <strong>
                  조회를 원하시는 내전코드
                </strong>
                를 입력해주세요!
              </p>

              <span>
                내전코드는 디스코드 및 프로필 조회에서 확인이 가능합니다.
              </span>

            </div>
          )}


          {query.trim() &&
            loading && (
              <div
                className={
                  styles.message
                }
              >
                검색 중입니다.
              </div>
            )}


          {query.trim() &&
            !loading &&
            results.length === 0 && (
              <div
                className={
                  styles.message
                }
              >

                <strong>
                  검색 결과가 없습니다.
                </strong>

                <span>
                  내전코드를 다시 확인해주세요.
                </span>

              </div>
            )}


          {!loading &&
            results.map(
              (match) => (
                <button
                  key={
                    match.code
                  }
                  type="button"
                  className={
                    styles.result
                  }
                  onMouseDown={
                    (event) => {
                      event.preventDefault();

                      openMatch(
                        match
                      );
                    }
                  }
                >

                  <div
                    className={
                      styles.resultCode
                    }
                  >
                    {
                      match.code
                    }
                  </div>


                  <div
                    className={
                      styles.resultInfo
                    }
                  >

                    <strong>
                      {
                        match.matchType
                      }
                    </strong>

                    <span>
                      {
                        match.fearlessType
                      }
                    </span>

                  </div>


                  <div
                    className={[
                      styles.status,

                      match.status ===
                      "playing"
                        ? styles.playing
                        : match.status ===
                          "open"
                        ? styles.open
                        : styles.finished,
                    ].join(" ")}
                  >
                    {
                      match.status ===
                      "playing"
                        ? "진행중"
                        : match.status ===
                          "open"
                        ? "모집중"
                        : "종료"
                    }
                  </div>

                </button>
              )
            )}

        </div>
      )}

    </form>
  );
}