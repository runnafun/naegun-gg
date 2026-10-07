"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import type {
  MatchSearchResult,
} from "../../data/matches";

import styles from "./MatchSearchInput.module.css";

type Props = {
  variant?: "hero" | "topbar";
  defaultValue?: string;
};

export default function MatchSearchInput({
  variant = "hero",
  defaultValue = "",
}: Props) {
  const router = useRouter();

  const [query, setQuery] =
    useState(defaultValue);

  const [results, setResults] =
    useState<MatchSearchResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const keyword =
      query
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

    if (!keyword) {
      setResults([]);
      setMessage("");
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          setLoading(true);
          setMessage("");

          try {
            const response =
              await fetch(
                `/api/matches/search?q=${encodeURIComponent(
                  keyword,
                )}`,
                {
                  cache: "no-store",
                },
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data?.error ??
                  "내전 검색 실패",
              );
            }

            const nextResults =
              Array.isArray(
                data?.results,
              )
                ? data.results
                : [];

            setResults(
              nextResults,
            );

            if (
              nextResults.length ===
              0
            ) {
              setMessage(
                "검색 결과가 없습니다.",
              );
            }
          } catch {
            setResults([]);
            setMessage(
              "내전 검색에 실패했습니다.",
            );
          } finally {
            setLoading(false);
          }
        },
        250,
      );

    return () =>
      window.clearTimeout(timer);
  }, [query]);

  function moveTo(
    code: string,
  ) {
    router.push(
      `/matches/result?code=${encodeURIComponent(
        code,
      )}`,
    );
  }

  function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    const keyword =
      query
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

    if (!keyword) {
      return;
    }

    const exact =
      results.find(
        (item) =>
          item.code.toUpperCase() ===
          keyword,
      );

    if (exact) {
      moveTo(exact.code);
      return;
    }

    if (results[0]) {
      moveTo(
        results[0].code,
      );
      return;
    }

    setMessage(
      "해당 내전을 찾을 수 없습니다.",
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`${styles.form} ${
        variant === "hero"
          ? styles.hero
          : styles.topbar
      }`}
    >
      <div
        className={
          styles.inputWrap
        }
      >
        <input
          className={
            styles.input
          }
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="EX) N103 또는 R105"
          autoComplete="off"
        />
      </div>

      {query.trim() && (
        <div
          className={
            styles.dropdown
          }
        >
          {loading && (
            <div
              className={
                styles.message
              }
            >
              <strong>
                내전 검색 중
              </strong>
              잠시만 기다려주세요.
            </div>
          )}

          {!loading &&
            message && (
              <div
                className={
                  styles.message
                }
              >
                <strong>
                  검색 결과
                </strong>
                {message}
              </div>
            )}

          {!loading &&
            results.map(
              (match) => (
                <button
                  type="button"
                  key={
                    match.code
                  }
                  className={
                    styles.result
                  }
                  onClick={() =>
                    moveTo(
                      match.code,
                    )
                  }
                >
                  <span
                    className={
                      styles.resultCode
                    }
                  >
                    {match.code}
                  </span>

                  <span
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
                  </span>

                  <span
                    className={`${styles.status} ${
                      styles[
                        match.status
                      ] ?? ""
                    }`}
                  >
                    {match.status ===
                    "open"
                      ? "모집중"
                      : match.status ===
                          "playing"
                        ? "진행중"
                        : "종료"}
                  </span>
                </button>
              ),
            )}
        </div>
      )}
    </form>
  );
}
