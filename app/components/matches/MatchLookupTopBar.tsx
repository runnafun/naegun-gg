"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  MatchLookupData,
} from "../../data/matchLookup";

import MatchSearchInput from
  "./MatchSearchInput";


type Props = {
  match:
    MatchLookupData;
};


export default function MatchLookupTopBar({
  match,
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


    const handleScroll =
      () => {
        const currentY =
          window.scrollY;


        if (
          currentY <= 10
        ) {
          setHeaderVisible(
            true
          );

          lastScrollY.current =
            currentY;

          return;
        }


        /*
          현재 내전.GG Header 동작 기준

          아래 스크롤 = Header 표시
          위 스크롤   = Header 숨김
        */

        if (
          currentY >
          lastScrollY.current
        ) {
          setHeaderVisible(
            true
          );

        } else if (
          currentY <
          lastScrollY.current
        ) {
          setHeaderVisible(
            false
          );
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
          "match-lookup-topbar",

          headerVisible
            ? "header-visible"
            : "header-hidden",
        ].join(" ")}
      >

        <div className="match-lookup-topbar-inner">

          <MatchSearchInput
            variant="topbar"
            defaultValue={
              match.code
            }
          />


          <div className="match-lookup-ranking-mini">

            <strong>
              내전.GG 랭킹
            </strong>

            <span>
              ▲ 1위 황소고집
            </span>

          </div>

        </div>

      </section>


      <div className="match-lookup-topbar-spacer" />
    </>
  );
}