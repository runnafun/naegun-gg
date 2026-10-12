import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { prisma } from "../../lib/prisma";
import {
  displayDate,
  displayTitle,
  isEvent,
} from "../utils";

import "../notice.css";

export const dynamic = "force-dynamic";

export default async function NoticeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.notice.findFirst({
    where: {
      id,
      published: true,
    },
    select: {
      title: true,
      content: true,
      createdAt: true,
    },
  });

  if (!item) notFound();

  return (
    <main className="notice-page">
      <Header active="notice" />

      <section className="notice-hero notice-detail-hero">
        <div className="notice-hero-text">
          <h1>공지사항 &amp; 이벤트</h1>
          <p>
            내전.GG의 새로운 소식과
            이벤트를 확인해 보세요.
          </p>
        </div>
      </section>

      <article className="notice-article">
        <Link
          href="/notice"
          className="notice-back"
        >
          ← 목록으로 돌아가기
        </Link>

        <header className="notice-article-heading">
          <span
            className={
              isEvent(item.title)
                ? "notice-category event"
                : "notice-category"
            }
          >
            {isEvent(item.title)
              ? "이벤트"
              : "공지"}
          </span>

          <h2>
            {displayTitle(item.title)}
          </h2>

          <time dateTime={item.createdAt.toISOString()}>
            {displayDate(item.createdAt)}
          </time>
        </header>

        <div className="notice-article-body">
          {item.content}
        </div>

        <Link
          href="/notice"
          className="notice-back notice-bottom-back"
        >
          목록으로
        </Link>
      </article>

      <Footer />
    </main>
  );
}
