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
  variant?: "hero" | "topbar";
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
                `/api/matches/search? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
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
              data.results ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺[]
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
      `/matches/result? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
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
          ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
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
                  鈺곌퀬? 모집중`r`n : 종료? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺 ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
                </strong>
                ? 모집중`r`n : 종료? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
              </p>

              <span>
                ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺 獄? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺 ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
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
                野꺜? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
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
                  野꺜? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺 ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
                </strong>

                <span>
                  ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺 ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
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
                        ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
                        : match.status ===
                          "open"
                        ? 모집중`r`n : 종료? 모집중`r`n : 종료 : 醫낅즺
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
