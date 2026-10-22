"use client";

import Image from "next/image";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import UserMenu from "./auth/UserMenu";

type HeaderProps = {
  active?:
    | "home"
    | "matches"
    | "profile"
    | "ranking"
    | "shop"
    | "notice"
    | "contact";
};

export default function Header({
  active = "home",
}: HeaderProps) {
  const [
    headerVisible,
    setHeaderVisible,
  ] =
    useState(true);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const lastScrollY =
    useRef(0);

  useEffect(() => {
    const handleScroll =
      () => {
        const currentScroll =
          window.scrollY;

        if (
          currentScroll <=
          10
        ) {
          setHeaderVisible(
            true,
          );

          lastScrollY.current =
            currentScroll;

          return;
        }

        if (
          currentScroll >
          lastScrollY.current
        ) {
          setHeaderVisible(
            true,
          );
        } else {
          setHeaderVisible(
            false,
          );
        }

        lastScrollY.current =
          currentScroll;
      };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  return (
    <header
      className={`header ${
        headerVisible
          ? "header-visible"
          : "header-hidden"
      }`}
    >
      <div className="header-inner">
        <a
          href="/"
          className="logo"
        >
          <Image
            src="/images/log1.png"
            alt="내전.GG"
            width={150}
            height={45}
            priority
          />
        </a>

        <nav className={`nav ${mobileNavOpen ? "nav-mobile-open" : ""}`} onClick={() => setMobileNavOpen(false)}>
          <a
            href="/"
            className={`nav-item ${
              active === "home"
                ? "active"
                : ""
            }`}
          >
            홈
          </a>

          <a
            href="/matches"
            className={`nav-item ${
              active ===
              "matches"
                ? "active"
                : ""
            }`}
          >
            내전정보
          </a>

          <a
            href="/profile-search"
            className={`nav-item ${
              active ===
              "profile"
                ? "active"
                : ""
            }`}
          >
            프로필검색
          </a>

          <a
            href="/ranking"
            className={`nav-item ${
              active ===
              "ranking"
                ? "active"
                : ""
            }`}
          >
            내전랭킹
          </a>

          {/* NAEGUN_ATTENDANCE_NAV_V1 */}
          <a href="/attendance" className="nav-item">출석체크</a>

          <a
            href="/shop"
            className={`nav-item ${
              active === "shop"
                ? "active"
                : ""
            }`}
          >
            상점
          </a>

          <a
            href="/notice"
            className={`nav-item ${
              active === "notice" ? "active" : ""
            }`}
          >
            공지&이벤트
          </a>

          <a
            href="/contact"
            className={`nav-item ${
              active ===
              "contact"
                ? "active"
                : ""
            }`}
          >
            문의하기
          </a>
        
          <a target="_blank" rel="noopener noreferrer"
            href="https://discord.com/channels/1547894802765451295/1558489684303159347"
            className="nav-item"
          >
            랭크트래커
          </a>

          <a
            href="https://discord.gg/a2BU6rDWcj"
            className="nav-item"
            target="_blank"
            rel="noopener noreferrer"
          >
            디스코드 서버
          </a>
</nav>

        <UserMenu />
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={mobileNavOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <span aria-hidden="true">{mobileNavOpen ? "✕" : "☰"}</span>
        </button>
      </div>
    </header>
  );
}