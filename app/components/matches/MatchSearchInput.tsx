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
                  議고쉶瑜??먰븯?쒕뒗 ?댁쟾肄붾뱶
                </strong>
                瑜??낅젰?댁＜?몄슂!
              </p>

              <span>
                ?댁쟾肄붾뱶???붿뒪肄붾뱶 諛??꾨줈??議고쉶?먯꽌 ?뺤씤??媛?ν빀?덈떎.
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
                寃??以묒엯?덈떎.
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
                  寃??寃곌낵媛 ?놁뒿?덈떎.
                </strong>

                <span>
                  ?댁쟾肄붾뱶瑜??ㅼ떆 ?뺤씤?댁＜?몄슂.
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
                        ? "吏꾪뻾以?
                        : match.status ===
                          "open"
                        ? "紐⑥쭛以?
                        : "醫낅즺"
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
