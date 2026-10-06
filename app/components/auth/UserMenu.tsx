"use client";

import Image from "next/image";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type AuthUser = {
  id: string;

  role:
    | "USER"
    | "ADMIN"
    | "SUPER_ADMIN";

  username: string;
  displayName: string;

  avatarUrl:
    | string
    | null;

  ggCoin: string;

  riotLinked: boolean;
};

export default function UserMenu() {
  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const wrapRef =
    useRef<HTMLDivElement>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              cache:
                "no-store",
            },
          );

        if (
          !response.ok
        ) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const data =
          await response.json();

        if (
          !cancelled &&
          data.authenticated
        ) {
          setUser(
            data.user,
          );
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleOutside(
      event: MouseEvent,
    ) {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutside,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  async function logout() {
    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
      },
    );

    window.location.href =
      "/";
  }

  if (loading) {
    return (
      <div className="login-button auth-loading">
        <Image
          src="/images/discord.png"
          alt="Discord"
          width={24}
          height={24}
        />

        <span>
          로그인 확인중
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/api/auth/discord"
        className="login-button"
      >
        <Image
          src="/images/discord.png"
          alt="Discord"
          width={24}
          height={24}
        />

        <span>
          로그인
        </span>
      </a>
    );
  }

  const isAdmin =
    user.role === "ADMIN" ||
    user.role ===
      "SUPER_ADMIN";

  const coinText =
    Number(
      user.ggCoin,
    ).toLocaleString(
      "ko-KR",
    );

  return (
    <div
      ref={wrapRef}
      className="user-menu-wrap"
    >
      <button
        type="button"
        className={`user-menu-trigger ${
          open
            ? "is-open"
            : ""
        }`}
        onClick={() =>
          setOpen(
            current =>
              !current,
          )
        }
      >
        <span className="user-menu-avatar">
          {user.avatarUrl ? (
            <img
              src={
                user.avatarUrl
              }
              alt={
                user.displayName
              }
            />
          ) : (
            <Image
              src="/images/discord.png"
              alt="Discord"
              width={28}
              height={28}
            />
          )}
        </span>

        <span className="user-menu-info">
          <strong>
            {
              user.displayName
            }
          </strong>

          <span>
            {coinText} GG
          </span>
        </span>

        <span
          className="user-menu-arrow"
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-head">
            <strong>
              {
                user.displayName
              }
            </strong>

            <span>
              {coinText} GG
            </span>
          </div>

          <div className="user-dropdown-divider" />

          <a
            href="/mypage"
            className="user-dropdown-item"
          >
            내 프로필
          </a>

          <a
            href="/mypage#riot"
            className="user-dropdown-item"
          >
            {user.riotLinked
              ? "Riot 계정 관리"
              : "Riot 계정 연결"}
          </a>

          <a
            href="/mypage#history"
            className="user-dropdown-item"
          >
            내 전적
          </a>

          <a
            href="/shop"
            className="user-dropdown-item"
          >
            상점
          </a>

          {isAdmin && (
            <a
              href="/admin"
              className="user-dropdown-item user-dropdown-admin"
            >
              관리자 페이지
            </a>
          )}

          <div className="user-dropdown-divider" />

          <button
            type="button"
            className="user-dropdown-item user-dropdown-logout"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}