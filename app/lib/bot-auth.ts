import crypto from "node:crypto";

export function isValidBotRequest(request: Request) {
  const secret = process.env.BOT_API_SECRET;

  if (!secret) {
    console.error("BOT_API_SECRET 환경변수가 없습니다.");
    return false;
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const received = authorization.slice(7);

  const expectedBuffer = Buffer.from(secret);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}