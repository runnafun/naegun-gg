"use client";

import {
  FormEvent,
  useState,
} from "react";

export default function AccountPage() {
  const [gameName, setGameName] =
    useState("");

  const [tagLine, setTagLine] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/riot/link",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            gameName,
            tagLine,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ??
            "연동에 실패했습니다.",
        );

        return;
      }

      setMessage(
        `${data.riotAccount.gameName}#${data.riotAccount.tagLine} 연동 완료`,
      );

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch {
      setMessage(
        "연동 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingTop: "160px",
        background: "#050806",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "min(520px, 90%)",
          margin: "0 auto",
        }}
      >
        <h1>Riot 계정 연동</h1>

        <p
          style={{
            opacity: 0.65,
            marginTop: "10px",
          }}
        >
          내전.GG에서 사용할 Riot ID를
          등록해주세요.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "30px",
          }}
        >
          <input
            value={gameName}
            onChange={(event) =>
              setGameName(
                event.target.value,
              )
            }
            placeholder="소환사 이름"
            style={{
              flex: 1,
              padding: "15px",
            }}
          />

          <input
            value={tagLine}
            onChange={(event) =>
              setTagLine(
                event.target.value,
              )
            }
            placeholder="KR1"
            style={{
              width: "120px",
              padding: "15px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding:
                "15px 22px",
              cursor: "pointer",
            }}
          >
            {loading
              ? "확인중..."
              : "연동"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "20px",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}