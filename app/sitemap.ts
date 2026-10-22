import type { MetadataRoute } from "next";

const site = "https://내전.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/matches",
    "/profile-search",
    "/ranking",
    "/shop",
    "/notice",
    "/guide/lol-discord-server",
    "/guide/lol-custom-game",
    "/lol-discord",
  ];

  return paths.map((path) => ({
    url: new URL(path, site).toString(),
    // NAEGUN_SEO_TECH_LASTMOD_V3 - 실제 SEO 페이지 수정일만 기재.
    lastModified: ["/lol-discord", "/guide/lol-discord-server", "/guide/lol-custom-game"].includes(path)
      ? new Date("2026-10-13")
      : undefined,
    changeFrequency: path.startsWith("/guide/") ? ("monthly" as const) : ("weekly" as const),
    priority: path === "/" ? 1 : path.startsWith("/guide/") ? 0.8 : 0.7,
  }));
}
