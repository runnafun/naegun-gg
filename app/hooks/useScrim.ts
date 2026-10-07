"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export function useScrim(
  code: string | null,
  intervalMs = 5000,
) {
  const [scrim, setScrim] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(Boolean(code));

  const [error, setError] =
    useState<string | null>(null);

  const refresh =
    useCallback(async () => {
      if (!code) {
        setScrim(null);
        setLoading(false);
        return;
      }

      try {
        const response =
          await fetch(
            `/api/scrims/${encodeURIComponent(
              code.trim().toUpperCase(),
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
              "내전 조회 실패",
          );
        }

        setScrim(data.scrim);
        setError(null);
      } catch (err) {
        setScrim(null);
        setError(
          err instanceof Error
            ? err.message
            : "내전 조회 실패",
        );
      } finally {
        setLoading(false);
      }
    }, [code]);

  useEffect(() => {
    refresh();

    if (
      !code ||
      intervalMs <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(
        refresh,
        intervalMs,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [
    code,
    intervalMs,
    refresh,
  ]);

  return {
    scrim,
    loading,
    error,
    refresh,
  };
}
