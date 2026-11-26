import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArtworkDetailView from "@/components/ArtworkDetailView";
import { findArtwork } from "@/lib/artwork-lookup";
import { describeArtwork } from "@/lib/artwork";
import { routing } from "@/i18n/routing";

type Params = Promise<{ locale: string; slug: string }>;

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

/**
 * Describes the artwork to crawlers and link previews.
 *
 * This is why the page is a server component: a "use client" page cannot
 * export metadata, so every artwork used to share one site-wide title.
 */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const artwork = await findArtwork(slug);

  if (!artwork) {
    return { title: "Artwork not found" };
  }

  const description =
    describeArtwork(artwork, locale).replace(/\s+/g, " ").trim().slice(0, 300) ||
    `${artwork.medium}, ${artwork.year}`;

  const path = `/artwork/${artwork.slug}`;
  const image = artwork.images?.[0]?.url;

  return {
    title: artwork.title,
    description,
    alternates: {
      canonical: `${baseUrl()}/${locale}${path}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${baseUrl()}/${l}${path}`])
      ),
    },
    openGraph: {
      type: "article",
      title: artwork.title,
      description,
      url: `${baseUrl()}/${locale}${path}`,
      locale,
      ...(image
        ? { images: [{ url: image, alt: artwork.images?.[0]?.alt ?? artwork.title }] }
        : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: artwork.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ArtworkPage({ params }: { params: Params }) {
  const { slug } = await params;
  const artwork = await findArtwork(slug);

  // A missing artwork is a 404, not an error message in a rendered page.
  if (!artwork) {
    notFound();
  }

  return <ArtworkDetailView artwork={artwork} />;
}
