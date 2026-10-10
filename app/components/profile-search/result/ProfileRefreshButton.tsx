"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type Props = {
  gameName: string;
  tagLine: string;
};


export default function ProfileRefreshButton({
  gameName,
  tagLine,
}: Props) {

  const router =
    useRouter();


  const [
    state,
    setState,
  ] = useState<
    | "idle"
    | "loading"
    | "done"
    | "error"
  >("idle");


  const [
    message,
    setMessage,
  ] = useState("");


  const refresh =
    async () => {

      if (
        state === "loading"
      ) {
        return;
      }


      try {

        setState(
          "loading",
        );

        setMessage(
          "전적 갱신 중...",
        );


        const response =
          await fetch(
            "/api/profile-refresh",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  gameName,
                  tagLine,
                }),
            },
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          setState(
            "error",
          );

          setMessage(
            data.message ??
            "갱신 실패",
          );


          setTimeout(
            () => {
              setState(
                "idle",
              );

              setMessage("");
            },
            2500,
          );

          return;
        }


        setState(
          "done",
        );


        setMessage(
          data.message ??
          "갱신 완료",
        );


        /*
          새로 저장된 RDS 데이터를
          Server Component가 다시 읽는다.
        */
        router.refresh();


        setTimeout(
          () => {
            setState(
              "idle",
            );

            setMessage("");
          },
          2000,
        );


      } catch {

        setState(
          "error",
        );

        setMessage(
          "갱신 실패",
        );


        setTimeout(
          () => {
            setState(
              "idle",
            );

            setMessage("");
          },
          2500,
        );
      }
    };


  return (
    <button
      type="button"
      onClick={refresh}
      disabled={
        state ===
        "loading"
      }
    >
      {
        state === "idle"
          ? "전적 갱신하기"
          : message
      }
    </button>
  );
}
