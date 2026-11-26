import type { Artwork as ArtworkRow } from "@prisma/client";
import type { Artwork } from "@/types/Artwork";

type RawDimensions = {
  width?: string | number;
  height?: string | number;
  unit?: string;
};

/**
 * Turns a database row into the shape the UI expects.
 *
 * Two historical formats have to survive here: `description` was once a plain
 * string before it became `{ en, bg }`, and `dimensions` holds numbers that the
 * admin form round-trips as strings. Both API routes use this so the list and
 * the detail view can never disagree about an artwork's shape.
 */
export function normalizeArtwork(artwork: ArtworkRow): Artwork {
  let description: { en: string; bg: string };

  if (typeof artwork.description === "string") {
    // Pre-i18n row: show the same text for both languages.
    description = { en: artwork.description, bg: artwork.description };
  } else if (artwork.description && typeof artwork.description === "object") {
    const raw = artwork.description as { en?: string; bg?: string };
    description = { en: raw.en || "", bg: raw.bg || "" };
  } else {
    description = { en: "", bg: "" };
  }

  const rawDimensions =
    typeof artwork.dimensions === "object" && artwork.dimensions !== null
      ? (artwork.dimensions as RawDimensions)
      : {};

  const images = (artwork.images ?? [])
    .map((image) => {
      if (typeof image !== "object" || image === null || !("url" in image)) {
        return null;
      }

      const url = (image as { url?: unknown }).url;

      // Uploads have been full Cloudinary URLs since the browser started
      // uploading directly; anything else is unusable, so drop it rather than
      // render a broken image.
      if (typeof url !== "string" || !url.startsWith("http")) {
        return null;
      }

      return {
        url,
        alt: (image as { alt?: string }).alt || artwork.title,
      };
    })
    .filter((image): image is { url: string; alt: string } => image !== null);

  return {
    ...artwork,
    description,
    dimensions: {
      width: String(rawDimensions.width ?? ""),
      height: String(rawDimensions.height ?? ""),
      unit: String(rawDimensions.unit ?? ""),
    },
    images,
  };
}

/**
 * Picks the description for a locale, tolerating the old string format.
 *
 * Safe to import from a client component: this module has only type-level
 * imports, unlike artwork-lookup.ts which reaches for the database.
 */
export function describeArtwork(artwork: Artwork, locale: string): string {
  if (typeof artwork.description === "string") return artwork.description;

  if (artwork.description && typeof artwork.description === "object") {
    return locale === "bg"
      ? artwork.description.bg || artwork.description.en || ""
      : artwork.description.en || artwork.description.bg || "";
  }

  return "";
}
