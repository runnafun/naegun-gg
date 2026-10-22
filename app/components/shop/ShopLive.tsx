
"use client";

import ShopCoinBalance from "./ShopCoinBalance";
import { useEffect, useMemo, useState } from "react";
import { SHOP_PRODUCTS } from "@/app/lib/naegun-shop-products";

import "./naegun-shop-ui.css";

const sections = [
  { kind: "TITLE", title: "칭호" },
  { kind: "RANK", title: "랭크 아이템" },
  { kind: "FRAME", title: "프로필 테두리" },
] as const;

const normalize = (v: string) =>
  v.toLowerCase().replace(/\s/g, "");

export default function ShopLive({
  query,
}: {
  query: string;
}) {
  const [balance, setBalance] = useState<string | null>(null);
  const [owned, setOwned] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    try {
      const response = await fetch("/api/shop/state", {
        cache: "no-store",
      });

      if (!response.ok) {
        setBalance(null);
        return;
      }

      const data = await response.json();

      setBalance(String(data.balance ?? "0"));

      setOwned(
        Array.isArray(data.items)
          ? data.items.map((item: { sku: string }) => item.sku)
          : []
      );
    } catch {
      setBalance(null);
    }
  }

  useEffect(() => {
    void refresh();

    const listener = () => {
      void refresh();
    };

    window.addEventListener("naegun-shop-updated", listener);

    return () => {
      window.removeEventListener("naegun-shop-updated", listener);
    };
  }, []);

  const products = useMemo(
    () =>
      SHOP_PRODUCTS.filter((p) =>
        normalize(p.name).includes(normalize(query))
      ),
    [query]
  );

  async function purchase(
    sku: string,
    name: string,
    price: number
  ) {
    if (busy) return;

    if (balance === null) {
      window.location.href = "/api/auth/discord";
      return;
    }

    if (
      !window.confirm(
        `${name}을(를) ${price.toLocaleString("ko-KR")} GG코인에 구매할까요?`
      )
    ) {
      return;
    }

    setBusy(sku);
    setNotice("");

    try {
      const response = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          requestId: crypto.randomUUID(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error === "INSUFFICIENT_GG_COIN"
            ? "GG코인이 부족합니다."
            : result.error === "FRAME_ALREADY_OWNED"
            ? "이미 보유한 테두리입니다."
            : String(result.error ?? "구매 실패")
        );
      }

      await refresh();

      setNotice(
        "구매 완료! 보관함에서 확인하세요."
      );

      window.dispatchEvent(
        new Event("naegun-shop-updated")
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "구매 실패"
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="ng-shop-status ng-shop-legacy-status">
        <span><ShopCoinBalance /></span>

        
      </div>

      {notice && (
        <p className="ng-shop-notice" role="status">
          {notice}
        </p>
      )}

      {sections.map((section) => {
        const items = products.filter(
          (p) => p.kind === section.kind
        );

        return (
          <section
            key={section.kind}
            className="shop-section"
          >
            <h2 className="shop-section-title">
              {section.title}
            </h2>

            {items.length ? (
              <div className="shop-product-grid shop-product-grid--title">
                {items.map((p) => {
                  const alreadyOwned =
                    p.kind === "FRAME" &&
                    owned.includes(p.id);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`shop-product-card shop-product-card--title ng-shop-legacy-card ${p.kind === "FRAME" ? "ng-shop-legacy-card--frame" : ""}`}
                      disabled={Boolean(busy) || alreadyOwned}
                      onClick={() =>
                        void purchase(
                          p.id,
                          p.name,
                          p.price
                        )
                      }
                      title={p.description}
                      aria-label={`${p.name} - ${p.price.toLocaleString("ko-KR")} GG`}
                    >
                      <div className="shop-product-card-overlay" />

                      <div className="shop-product-card-inner">
                        <div className="shop-product-thumb">
                          <img
                            src={p.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="shop-product-thumb-image"
                          />
                        </div>

                        <div className="shop-product-meta">
                          <strong className="shop-product-name">
                            {p.name}
                          </strong>

                          <span className="shop-product-price">
                            {p.price.toLocaleString("ko-KR")} GG
                          </span>

                          <span className="ng-shop-card-action">
                            {alreadyOwned
                              ? "보유 중"
                              : busy === p.id
                              ? "구매 처리 중"
                              : "구매하기"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="shop-empty-state">
                검색 결과가 없습니다.
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
