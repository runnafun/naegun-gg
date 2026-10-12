import { Pool } from "pg";

const holder = globalThis as typeof globalThis & { __naegunBannerPool?: Pool };
export function bannerPool() {
  if (!holder.__naegunBannerPool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
    holder.__naegunBannerPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  }
  return holder.__naegunBannerPool;
}

export function safeBannerUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const url = input.trim();
  if (!url || url.length > 600) return null;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.toString();
  } catch { /* invalid URL */ }
  return null;
}

export function checkBannerMagic(buf: Buffer, type: string) {
  if (type === "image/png") return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (type === "image/jpeg") return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === "image/webp") return buf.length > 12 && buf.toString("ascii",0,4)==="RIFF" && buf.toString("ascii",8,12)==="WEBP";
  return false;
}
