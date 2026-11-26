import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";

const STATIC_PATHS = [
  "",
  "/shop",
  "/prints",
  "/linocut-stamps",
  "/accessories",
  "/about",
  "/contact",
];

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  const entries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }))
  );

  try {
    const artworks = await db.artwork.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });

    for (const locale of routing.locales) {
      for (const artwork of artworks) {
        entries.push({
          url: `${base}/${locale}/artwork/${artwork.slug}`,
          lastModified: artwork.updatedAt,
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    // A database hiccup should not fail the build or serve an empty sitemap;
    // the static pages are still worth listing.
    console.error("Could not add artworks to the sitemap:", error);
  }

  return entries;
}
