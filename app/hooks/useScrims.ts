"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  PublicScrim,
  PublicScrimStatus,
  ScrimListResponse,
} from "../lib/scrims/types";

type UseScrimsOptions = {
  type?: "NORMAL" | "RANKED";
  status?: PublicScrimStatus;
  active?: boolean;
  limit?: number;
  participants?: boolean;
  intervalMs?: number;
};

type UseScrimsResult = {
  items: PublicScrim[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useScrims(
  options: UseScrimsOptions = {},
): UseScrimsResult {
  const {
    type,
    status,
    active = false,
    limit = 100,
    participants = false,
    intervalMs = 5000,
  } = options;

  const [items, setItems] =
    useState<PublicScrim[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const mountedRef =
    useRef(true);

  const fetchScrims =
    useCallback(async () => {
      const params =
        new URLSearchParams();

      if (type) {
        params.set(
          "type",
          type,
        );
      }

      if (status) {
        params.set(
          "status",
          status,
        );
      }

      if (active) {
        params.set(
          "active",
          "1",
        );
      }

      params.set(
        "limit",
        String(limit),
      );

      if (participants) {
        params.set(
          "participants",
          "1",
        );
      }

      try {
        const response =
          await fetch(
            `/api/scrims?${params.toString()}`,
            {
              cache: "no-store",
            },
          );

        const data =
          (await response.json()) as
            | ScrimListResponse
            | {
                items?: PublicScrim[];
                scrims?: PublicScrim[];
                message?: string;
                error?: string;
              };

        if (!response.ok) {
          throw new Error(
            "message" in data &&
            data.message
              ? data.message
              : "error" in data &&
                  data.error
                ? data.error
                : `내전 목록 조회 실패 (${response.status})`,
          );
        }

        const nextItems =
          Array.isArray(
            (data as ScrimListResponse)
              .items,
          )
            ? (
                data as ScrimListResponse
              ).items
            : Array.isArray(
                  (
                    data as {
                      scrims?: PublicScrim[];
                    }
                  ).scrims,
                )
              ? (
                  data as {
                    scrims: PublicScrim[];
                  }
                ).scrims
              : [];

        if (
          mountedRef.current
        ) {
          setItems(
            nextItems,
          );
          setError(null);
        }
      } catch (err) {
        if (
          mountedRef.current
        ) {
          setError(
            err instanceof Error
              ? err.message
              : "내전 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (
          mountedRef.current
        ) {
          setLoading(false);
        }
      }
    }, [
      type,
      status,
      active,
      limit,
      participants,
    ]);

  useEffect(() => {
    mountedRef.current = true;

    void fetchScrims();

    if (
      !intervalMs ||
      intervalMs <= 0
    ) {
      return () => {
        mountedRef.current =
          false;
      };
    }

    const timer =
      window.setInterval(
        () => {
          void fetchScrims();
        },
        intervalMs,
      );

    return () => {
      mountedRef.current =
        false;

      window.clearInterval(
        timer,
      );
    };
  }, [
    fetchScrims,
    intervalMs,
  ]);

  return {
    items,
    loading,
    error,
    refresh: fetchScrims,
  };
}
