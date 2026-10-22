
"use client";

import { useEffect, useState } from "react";

export default function ShopCoinBalance() {
  const [text, setText] = useState(
    "보유 GG코인: 확인 중..."
  );

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });

        const data = await response.json();

        if (!response.ok || !data.authenticated || !data.user) {
          if (mounted) {
            setText("디스코드 로그인 후 구매할 수 있습니다.");
          }
          return;
        }

        const raw = String(data.user.ggCoin ?? "");

        if (!/^\d+$/.test(raw)) {
          throw new Error("INVALID_BALANCE");
        }

        if (mounted) {
          setText(
            `보유 GG코인: ${BigInt(raw).toLocaleString("ko-KR")} GG`
          );
        }
      } catch {
        if (mounted) {
          setText("보유 GG코인: 잔액 확인 불가");
        }
      }
    }

    void refresh();

    const updated = () => void refresh();
    const visible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("naegun-shop-updated", updated);
    document.addEventListener("visibilitychange", visible);

    return () => {
      mounted = false;
      window.removeEventListener("naegun-shop-updated", updated);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  return <>{text}</>;
}
