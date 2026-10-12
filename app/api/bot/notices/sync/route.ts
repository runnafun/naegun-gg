import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";

// Discord Forum -> existing Prisma Notice model. Never accept updates without bot auth.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FORUM_CHANNEL_ID = "1558301582234353725";
const SNOWFLAKE = /^\d{17,22}$/;

type PostBody = {
  action?: "UPSERT" | "DELETE";
  channelId?: string;
  threadId?: string;
  messageId?: string;
  title?: string;
  content?: string;
  category?: "NOTICE" | "EVENT";
  createdAt?: string;
};

export async function GET(request: NextRequest) {
  if (!isValidBotRequest(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const count = await prisma.notice.count({
    where: { discordThreadId: { not: null } },
  });
  return NextResponse.json({ ok: true, syncedNotices: count });
}

export async function POST(request: NextRequest) {
  if (!isValidBotRequest(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  let data: PostBody;
  try { data = (await request.json()) as PostBody; }
  catch { return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 }); }

  if (data.channelId !== FORUM_CHANNEL_ID ||
      typeof data.threadId !== "string" || !SNOWFLAKE.test(data.threadId)) {
    return NextResponse.json({ ok: false, error: "INVALID_FORUM_OR_THREAD" }, { status: 400 });
  }
  if (data.action !== "UPSERT" && data.action !== "DELETE") {
    return NextResponse.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
  }

  const threadId = data.threadId;
  if (data.action === "UPSERT") {
    if (typeof data.title !== "string" || !data.title.trim() ||
        typeof data.content !== "string" ||
        typeof data.messageId !== "string" || !SNOWFLAKE.test(data.messageId) ||
        data.title.length > 250 || data.content.length > 30000) {
      return NextResponse.json({ ok: false, error: "INVALID_NOTICE_DATA" }, { status: 400 });
    }
  }

  const createdAt = data.createdAt ? new Date(data.createdAt) : null;
  const safeCreatedAt = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : new Date();
  const rawTitle = (data.title ?? "").trim();
  // The existing /notice page categorizes events by the [이벤트] title prefix.
  const event = data.category === "EVENT" || /^\[이벤트\]/.test(rawTitle);
  const title = event && !/^\[이벤트\]/.test(rawTitle) ? `[이벤트] ${rawTitle}` : rawTitle;

  try {
    // Serialize per-thread operations, without changing the existing Prisma schema.
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::int AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${threadId})::bigint)) AS held`;
      const existing = await tx.notice.findFirst({ where: { discordThreadId: threadId } });
      if (data.action === "DELETE") {
        if (!existing) return { id: null as string | null, published: false, skipped: true };
        const hidden = await tx.notice.update({
          where: { id: existing.id }, data: { published: false },
        });
        return { id: hidden.id, published: false, skipped: false };
      }

      if (existing) {
        const updated = await tx.notice.update({
          where: { id: existing.id },
          data: {
            title, content: data.content!, discordThreadId: threadId,
            discordMessageId: data.messageId!, published: true,
          },
        });
        return { id: updated.id, published: true, skipped: false };
      }
      const inserted = await tx.notice.create({
        data: {
          title, content: data.content!, discordThreadId: threadId,
          discordMessageId: data.messageId!, published: true,
          createdAt: safeCreatedAt,
        },
      });
      return { id: inserted.id, published: true, skipped: false };
    }, { timeout: 15000 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("DISCORD_NOTICE_SYNC_ERROR", threadId, error);
    return NextResponse.json({ ok: false, error: "NOTICE_SYNC_FAILED" }, { status: 500 });
  }
}
