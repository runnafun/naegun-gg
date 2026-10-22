import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// EC2에 설치 파일 업로드 후 메뉴를 누르면 즉시 다운로드합니다.
// 기본 위치: ~/naegun-gg/public/downloads/NaegunGG-Tracker-Setup.exe
// 선택: TRACKER_SETUP_PATH 환경변수로 절대경로 변경 가능
export async function GET() {
  const filePath = process.env.TRACKER_SETUP_PATH
    ? path.resolve(process.env.TRACKER_SETUP_PATH)
    : path.join(process.cwd(), "public", "downloads", "NaegunGG-Tracker-Setup.exe");

  let fileInfo;
  try {
    fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) throw new Error("Not a file");
  } catch {
    return new Response(
      "랭크트래커 설치 파일이 아직 서버에 등록되지 않았습니다. 운영자에게 문의해 주세요.",
      {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="NaegunGG-Tracker-Setup.exe"',
      "Content-Length": String(fileInfo.size),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
