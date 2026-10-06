"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  ProfileSearchResult,
} from "../../data/profile";

import styles from "./ProfileSearchInput.module.css";


type Props = {
  defaultValue?: string;

  variant?:
    | "hero"
    | "topbar";
};


export default function ProfileSearchInput({
  defaultValue = "",
  variant = "hero",
}: Props) {

  const router =
    useRouter();


  const [
    query,
    setQuery,
  ] = useState(
    defaultValue
  );


  const [
    results,
    setResults,
  ] = useState<
    ProfileSearchResult[]
  >([]);


  const [
    focused,
    setFocused,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  /* ==================================================
     SEARCH
  ================================================== */

  useEffect(() => {

    const cleanQuery =
      query.trim();


    if (!cleanQuery) {

      setResults([]);

      setLoading(false);

      return;
    }


    const timer =
      setTimeout(
        async () => {

          try {

            setLoading(true);


            const response =
              await fetch(
                `/api/profile-search?q=${encodeURIComponent(
                  cleanQuery
                )}`
              );


            if (!response.ok) {

              setResults([]);

              return;
            }


            const data =
              await response.json();


            setResults(
              data.results ?? []
            );

          } catch {

            setResults([]);

          } finally {

            setLoading(false);

          }

        },
        180
      );


    return () => {
      clearTimeout(timer);
    };

  }, [query]);


  /* ==================================================
     MOVE PROFILE
  ================================================== */

  const openProfile = (
    profile: ProfileSearchResult
  ) => {

    const params =
      new URLSearchParams({
        gameName:
          profile.gameName,

        tagLine:
          profile.tagLine,
      });


    router.push(
      `/profile-search/result?${params.toString()}`
    );
  };


  /* ==================================================
     ENTER
  ================================================== */

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();


    if (
      results.length > 0
    ) {
      openProfile(
        results[0]
      );
    }
  };


  const showDropdown =
    focused;


  return (
    <form
      className={[
        styles.form,
        variant === "hero"
          ? styles.hero
          : styles.topbar,
      ].join(" ")}
      onSubmit={
        handleSubmit
      }
    >

      <div className={styles.inputWrap}>

        <input
          type="text"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          onFocus={() =>
            setFocused(true)
          }
          onBlur={() => {

            setTimeout(
              () => {
                setFocused(false);
              },
              150
            );

          }}
          placeholder="EX) 소환사이름#KR1"
          autoComplete="off"
          className={styles.input}
        />

      </div>


      {showDropdown && (
        <div className={styles.dropdown}>


          {!query.trim() && (
            <div className={styles.guide}>

              <p>

                <strong>
                  플레이어 이름 + 태그
                </strong>

                로 검색해주세요!

              </p>

              <span>
                내전.GG에 등록된 소환사만 조회가 가능합니다.
              </span>

            </div>
          )}


          {query.trim() &&
            loading && (

            <div className={styles.message}>
              검색 중입니다.
            </div>

          )}


          {query.trim() &&
            !loading &&
            results.length === 0 && (

            <div className={styles.message}>

              <strong>
                검색 결과가 없습니다.
              </strong>

              <span>
                등록된 소환사인지 확인해주세요.
              </span>

            </div>

          )}


          {!loading &&
            results.map(
              (profile) => (

              <button
                key={
                  profile.puuid
                }
                type="button"
                className={styles.result}
                onMouseDown={(
                  event
                ) => {

                  event.preventDefault();

                  openProfile(
                    profile
                  );

                }}
              >

                <img
                  src={
                    profile.profileIcon
                  }
                  alt=""
                  className={styles.icon}
                />


                <div className={styles.resultInfo}>

                  <div className={styles.resultName}>

                    <strong>
                      {
                        profile.gameName
                      }
                    </strong>

                    <span>
                      #
                      {
                        profile.tagLine
                      }
                    </span>

                  </div>


                  <p>
                    {
                      profile.soloTier
                    }{" "}
                    {
                      profile.soloRank
                    }
                    {" · "}
                    {
                      profile.soloLp
                    }
                    LP
                  </p>

                </div>


                <div className={styles.internalRank}>
                  {
                    profile.internalRank
                  }
                </div>

              </button>

            )
          )}

        </div>
      )}

    </form>
  );
}