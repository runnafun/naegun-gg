import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/account/", "/mypage/", "/api/"],
    },
    sitemap: "https://내전.com/sitemap.xml",
  };
}
