import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { prisma } from "../lib/prisma";
import {
  isEvent,
  displayTitle,
  displayDate,
} from "./utils";

import "./notice.css";

export const dynamic = "force-dynamic";

type Query = {
  tab?: string;
  q?: string;
  page?: string;
};

const PAGE_SIZE = 12;

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const params = await searchParams;

  const tab =
    params.tab === "event" ||
    params.tab === "notice"
      ? params.tab
      : "all";

  const q = (params.q ?? "")
    .trim()
    .slice(0, 100);

  const rows = await prisma.notice.findMany({
    where: {
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
    take: 300,
  });

  const filtered = rows.filter((row) => {
    const event = isEvent(row.title);

    return (
      (
        tab === "all" ||
        (tab === "event" ? event : !event)
      ) &&
      (
        !q ||
        displayTitle(row.title)
          .toLocaleLowerCase()
          .includes(q.toLocaleLowerCase())
      )
    );
  });

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const requested = Number(
    params.page ?? 1
  );

  const page = Number.isSafeInteger(requested)
    ? Math.min(pages, Math.max(1, requested))
    : 1;

  const visible = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const href = (
    nextTab: string,
    nextPage = 1
  ) =>
    `/notice?${new URLSearchParams({
      tab: nextTab,
      q,
      page: String(nextPage),
    })}`;

  return (
    <main className="notice-page">
      <Header active="notice" />

      <section className="notice-hero">
        <div className="notice-hero-text">
          <h1>공지사항 &amp; 이벤트</h1>
          <p>
            내전.GG의 새로운 소식과
            이벤트를 확인해 보세요.
          </p>
        </div>
      </section>

      <section className="notice-board">
        <div className="notice-toolbar">
          <nav
            className="notice-tabs"
            aria-label="게시판 카테고리"
          >
            {([
              ["all", "전체"],
              ["notice", "공지사항"],
              ["event", "이벤트"],
            ] as const).map(([value, text]) => (
              <Link
                key={value}
                href={href(value)}
                className={
                  tab === value
                    ? "notice-tab active"
                    : "notice-tab"
                }
              >
                {text}
              </Link>
            ))}
          </nav>

          <form
            className="notice-search"
            action="/notice"
            method="get"
          >
            <input
              type="hidden"
              name="tab"
              value={tab}
            />
            <input
              name="q"
              defaultValue={q}
              maxLength={100}
              placeholder="제목 검색"
              aria-label="제목 검색"
            />
            <button type="submit">
              검색
            </button>
          </form>
        </div>

        <div className="notice-list-header">
          <span>분류</span>
          <span>제목</span>
          <span>등록일</span>
        </div>

        {visible.length ? (
          visible.map((row) => (
            <Link
              href={`/notice/${encodeURIComponent(row.id)}`}
              key={row.id}
              className="notice-item"
            >
              <span
                className={
                  isEvent(row.title)
                    ? "notice-category event"
                    : "notice-category"
                }
              >
                {isEvent(row.title)
                  ? "이벤트"
                  : "공지"}
              </span>

              <span className="notice-item-title">
                {displayTitle(row.title)}
              </span>

              <time dateTime={row.createdAt.toISOString()}>
                {displayDate(row.createdAt)}
              </time>
            </Link>
          ))
        ) : (
          <div className="notice-empty">
            {q
              ? "검색 결과가 없습니다."
              : "등록된 게시글이 없습니다."}
          </div>
        )}

        {pages > 1 && (
          <div className="notice-pager">
            {page > 1 && (
              <Link href={href(tab, page - 1)}>
                이전
              </Link>
            )}

            <span>{page} / {pages}</span>

            {page < pages && (
              <Link href={href(tab, page + 1)}>
                다음
              </Link>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
