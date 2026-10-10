"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type RiotAccount = {
  gameName: string;
  tagLine: string;
};

type AuthUser = {
  role: string;
  status: string;

  username: string;
  displayName: string;

  discordUserId: string;
  avatarUrl: string | null;

  ggCoin: string;

  riotLinked: boolean;
  riotAccount: RiotAccount | null;
};

type MeResponse = {
  authenticated: boolean;
  user?: AuthUser;
};

export default function UserMenu() {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [open, setOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response =
          await fetch("/api/auth/me", {
            cache: "no-store",
          });

        const data: MeResponse =
          await response.json();

        if (
          response.ok &&
          data.authenticated &&
          data.user
        ) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(
          "로그인 사용자 조회 실패:",
          error,
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );

      window.location.href = "/";
    } catch (error) {
      console.error(
        "로그아웃 실패:",
        error,
      );
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        로그인 확인중
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/api/auth/discord"
        className="login-button"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="currentColor"
          style={{ flexShrink: 0 }}
        >
          <path d="M19.54 5.34A16.6 16.6 0 0 0 15.44 4c-.18.32-.39.75-.53 1.09a15.38 15.38 0 0 0-4.58 0A11.7 11.7 0 0 0 9.79 4a16.9 16.9 0 0 0-4.11 1.35C3.08 9.24 2.38 13.03 2.73 16.77a16.44 16.44 0 0 0 5.03 2.55c.41-.55.77-1.14 1.08-1.76-.59-.22-1.15-.5-1.69-.82.14-.1.28-.21.41-.32a11.8 11.8 0 0 0 10.15 0c.14.11.27.22.41.32-.54.32-1.1.6-1.69.82.31.62.68 1.21 1.08 1.76a16.52 16.52 0 0 0 5.03-2.55c.41-4.34-.7-8.1-2.99-11.43ZM8.52 14.5c-.98 0-1.79-.9-1.79-2.01s.79-2.01 1.79-2.01 1.81.91 1.79 2.01c0 1.11-.79 2.01-1.79 2.01Zm6.25 0c-.98 0-1.79-.9-1.79-2.01s.79-2.01 1.79-2.01 1.81.91 1.79 2.01c0 1.11-.79 2.01-1.79 2.01Z" />
        </svg>
        로그인
      </Link>
    );
  }

  const isAdmin =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN";

  const formattedCoin =
    Number(
      user.ggCoin ?? "0",
    ).toLocaleString("ko-KR");

  const profileHref =
    user.riotLinked &&
    user.riotAccount
      ? `/profile-search/result?gameName=${encodeURIComponent(
          user.riotAccount
            .gameName,
        )}&tagLine=${encodeURIComponent(
          user.riotAccount
            .tagLine,
        )}`
      : "/account";

  return (
    <div
      className="user-menu-wrap"
      ref={menuRef}
    >
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() =>
          setOpen((prev) => !prev)
        }
        aria-expanded={open}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="user-menu-avatar"
          />
        ) : (
          <div className="user-menu-avatar-fallback">
            {user.displayName
              ?.charAt(0)
              .toUpperCase() ?? "?"}
          </div>
        )}

        <div className="user-menu-info">
          <span className="user-menu-name">
            {user.displayName}
          </span>

          <span className="user-menu-coin">
            {formattedCoin} GG
          </span>
        </div>

        <span
          className={`user-menu-arrow ${
            open ? "open" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-dropdown-head">
            <strong>
              {user.displayName}
            </strong>

            <span>
              {formattedCoin} GG
            </span>

            {user.riotLinked &&
              user.riotAccount && (
                <small>
                  {
                    user.riotAccount
                      .gameName
                  }
                  #
                  {
                    user.riotAccount
                      .tagLine
                  }
                </small>
              )}
          </div>

          {user.riotLinked &&
          user.riotAccount ? (
            <>
              <Link
                href={profileHref}
                className="user-menu-item"
                onClick={() =>
                  setOpen(false)
                }
              >
                내 프로필
              </Link>

              <Link
                href="/account"
                className="user-menu-item"
                onClick={() =>
                  setOpen(false)
                }
              >
                Riot 계정 관리
              </Link>
            </>
          ) : (
            <Link
              href="/account"
              className="user-menu-item"
              onClick={() =>
                setOpen(false)
              }
            >
              Riot 계정 연동
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="user-menu-item user-menu-admin"
              onClick={() =>
                setOpen(false)
              }
            >
              관리자
            </Link>
          )}

          <button
            type="button"
            className="user-menu-item user-menu-logout"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}