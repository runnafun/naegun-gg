"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type HeaderProps = {
  active?:
    | "home"
    | "matches"
    | "profile"
    | "ranking"
    | "shop"
    | "contact";
};

export default function Header({
  active = "home",
}: HeaderProps) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (currentScroll <= 10) {
        setHeaderVisible(true);
        lastScrollY.current = currentScroll;
        return;
      }

      if (currentScroll > lastScrollY.current) {
        setHeaderVisible(true);
      } else {
        setHeaderVisible(false);
      }

      lastScrollY.current = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`header ${
        headerVisible ? "header-visible" : "header-hidden"
      }`}
    >
      <div className="header-inner">
        <a href="/" className="logo">
          <Image
            src="/images/log1.png"
            alt="내전.GG"
            width={150}
            height={45}
            priority
          />
        </a>

        <nav className="nav">
          <a
            href="/"
            className={`nav-item ${active === "home" ? "active" : ""}`}
          >
            홈
          </a>

          <a
            href="/matches"
            className={`nav-item ${active === "matches" ? "active" : ""}`}
          >
            내전정보
          </a>

          <a
            href="/profile-search"
            className={`nav-item ${active === "profile" ? "active" : ""}`}
          >
            프로필검색
          </a>

          <a
            href="/ranking"
            className={`nav-item ${active === "ranking" ? "active" : ""}`}
          >
            내전랭킹
          </a>

          <a
            href="/shop"
            className={`nav-item ${active === "shop" ? "active" : ""}`}
          >
            상점
          </a>

          <a
            href="/contact"
            className={`nav-item ${active === "contact" ? "active" : ""}`}
          >
            문의하기
          </a>
        </nav>

        <button className="login-button">
          <Image
            src="/images/discord.png"
            alt="디스코드"
            width={24}
            height={24}
          />

          <span>로그인</span>
        </button>
      </div>
    </header>
  );
}