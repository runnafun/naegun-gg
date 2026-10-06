"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";

import ShopHero from "../components/shop/ShopHero";
import ShopSection from "../components/shop/ShopSection";

import {
  shopCardItems,
  shopTitleItems,
} from "../data/shop";

import "./shop.css";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\s/g, "");
}

export default function ShopPage() {
  const [query, setQuery] = useState("");
  const [visibleTitleCount, setVisibleTitleCount] =
    useState(21);

  useEffect(() => {
    setVisibleTitleCount(21);
  }, [query]);

  const filteredCardItems = useMemo(() => {
    const keyword = normalizeText(query);

    if (!keyword) {
      return shopCardItems;
    }

    return shopCardItems.filter((item) =>
      normalizeText(item.name).includes(keyword)
    );
  }, [query]);

  const filteredTitleItems = useMemo(() => {
    const keyword = normalizeText(query);

    if (!keyword) {
      return shopTitleItems;
    }

    return shopTitleItems.filter((item) =>
      normalizeText(item.name).includes(keyword)
    );
  }, [query]);

  const visibleTitleItems =
    filteredTitleItems.slice(0, visibleTitleCount);

  const hasMoreTitles =
    filteredTitleItems.length > visibleTitleCount;

  return (
    <main className="shop-page">
      <Header active="shop" />

      <ShopHero
        query={query}
        onChange={setQuery}
      />

      <section className="shop-content">
        <div className="shop-content-inner">
          <ShopSection
            title="카드뽑기"
            items={filteredCardItems}
            variant="pack"
          />

          <ShopSection
            title="서버 칭호"
            items={visibleTitleItems}
            variant="title"
            hasMore={hasMoreTitles}
            onMore={() =>
              setVisibleTitleCount(
                (prev) => prev + 9
              )
            }
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}