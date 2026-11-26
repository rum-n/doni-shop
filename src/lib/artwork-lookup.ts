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
