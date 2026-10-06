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