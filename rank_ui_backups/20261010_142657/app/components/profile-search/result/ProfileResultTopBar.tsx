"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ProfileData,
} from "../../../data/profile";

import ProfileSearchInput from "../ProfileSearchInput";


type Props = {
  profile: ProfileData;
};


export default function ProfileResultTopBar({
  profile,
}: Props) {
  const [
    headerVisible,
    setHeaderVisible,
  ] = useState(true);

  const lastScrollY =
    useRef(0);


  useEffect(() => {
    lastScrollY.current =
      window.scrollY;

    const handleScroll = () => {
      const currentY =
        window.scrollY;

      if (currentY <= 10) {
        setHeaderVisible(true);

        lastScrollY.current =
          currentY;

        return;
      }

      if (
        currentY >
        lastScrollY.current
      ) {
        /*
          기존 Header 동작 기준:
          아래로 스크롤 → Header 보임
        */
        setHeaderVisible(true);
      } else if (
        currentY <
        lastScrollY.current
      ) {
        /*
          위로 스크롤 → Header 숨김
        */
        setHeaderVisible(false);
      }

      lastScrollY.current =
        currentY;
    };


    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );


    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);


  return (
    <>
      <section
        className={[
          "profile-result-topbar",
          headerVisible
            ? "header-visible"
            : "header-hidden",
        ].join(" ")}
      >
        <div className="profile-result-topbar-inner">

          <ProfileSearchInput
            variant="topbar"
            defaultValue={
              `${profile.gameName}#${profile.tagLine}`
            }
          />


          <div className="profile-result-ranking-mini">

            <strong>
              내전.GG 랭킹
            </strong>

            <span>
              ▲{" "}
              {
                profile.internalRankPosition
              }
              위{" "}
              {
                profile.gameName
              }
            </span>

          </div>

        </div>
      </section>


      {/* fixed 검색툴바가 차지하던 공간 */}
      <div className="profile-result-topbar-spacer" />
    </>
  );
}