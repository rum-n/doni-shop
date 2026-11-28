import { db } from "@/lib/db";
import { normalizeArtwork } from "@/lib/artwork";
import type { Artwork } from "@/types/Artwork";

/**
 * Finds one artwork by slug, falling back to its id.
 *
 * Shared by the detail page and its `generateMetadata`, so a request renders
 * and describes the same record. Older links used the raw ObjectId, which is
 * why the id fallback is here.
 */
export async function findArtwork(slugOrId: string): Promise<Artwork | null> {
  const bySlug = await db.artwork.findUnique({ where: { slug: slugOrId } });

  if (bySlug) return normalizeArtwork(bySlug);

  if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
    const byId = await db.artwork.findUnique({ where: { id: slugOrId } });
    if (byId) return normalizeArtwork(byId);
  }

  return null;
}

/**
 * Lists artworks for a storefront page, read on the server.
 *
 * Pages used to fetch their own API from `useEffect`, which meant the markup a
 * crawler (or a slow connection) first received was a spinner. Reading the
 * database here puts the real content in the HTML.
 */
export async function listArtworks(options?: {
  category?: string;
  inStock?: boolean;
}): Promise<Artwork[]> {
  const where: { category?: string; inStock?: boolean } = {};

  if (options?.category) where.category = options.category;
  if (typeof options?.inStock === "boolean") where.inStock = options.inStock;

  const rows = await db.artwork.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(normalizeArtwork);
}
