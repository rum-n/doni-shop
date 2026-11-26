import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing here is useful to a crawler, and the admin pages are gated.
        disallow: ["/api/", "/admin", "/*/admin", "/login", "/*/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
