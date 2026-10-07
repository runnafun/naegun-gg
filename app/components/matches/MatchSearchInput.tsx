"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type Props = {
  variant?: "hero" | "topbar";
  defaultValue?: string;
};

export default function MatchSearchInput({
  variant = "hero",
  defaultValue = "",
}: Props) {
  const router = useRouter();

  const [code, setCode] =
    useState(defaultValue);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setCode(defaultValue);
  }, [defaultValue]);

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    const normalized =
      code
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

    if (
      !/^([NR])\d{1,6}$/.test(
        normalized,
      )
    ) {
      setError(
        "내전 코드를 확인해주세요. 예: N103 / R105",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/scrims/${encodeURIComponent(
            normalized,
          )}`,
          {
            cache: "no-store",
          },
        );

      if (!response.ok) {
        setError(
          "해당 내전을 찾을 수 없습니다.",
        );
        return;
      }

      router.push(
        `/matches/result?code=${encodeURIComponent(
          normalized,
        )}`,
      );
    } catch {
      setError(
        "내전 조회 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={
        variant === "hero"
          ? "matches-search"
          : "match-search-topbar"
      }
    >
      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value,
            )
          }
          placeholder="EX) N103 또는 R105"
          autoComplete="off"
          style={{
            width: "100%",
          }}
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "조회중"
            : "검색"}
        </button>
      </div>

      {error && (
        <p
          style={{
            marginTop: 10,
            color: "#ff8c8c",
            fontSize: 13,
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
