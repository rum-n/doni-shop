import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

/**
 * Builds the metadata for a static page: a localised title and description,
 * a canonical URL, and one hreflang entry per locale so the two language
 * versions are understood as the same page rather than duplicates.
 */
export async function pageMetadata({
  locale,
  path,
  titleKey,
  descriptionKey,
  override,
}: {
  locale: string;
  /** Route path without the locale prefix, e.g. "/shop". */
  path: string;
  /** Key under the page's own namespace, resolved by the caller. */
  titleKey: string;
  /** Key under the `Meta` namespace, used when `override` is not given. */
  descriptionKey: keyof Messages;
  /** A ready-made description, e.g. a category's own blurb. */
  override?: string;
}): Promise<Metadata> {
  const meta = await getTranslations({ locale, namespace: "Meta" });
  const url = `${baseUrl()}/${locale}${path === "/" ? "" : path}`;
  const description = override || meta(descriptionKey as string);

  return {
    title: titleKey,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${baseUrl()}/${l}${path === "/" ? "" : path}`,
        ])
      ),
    },
    openGraph: {
      type: "website",
      title: titleKey,
      description,
      url,
      locale,
      siteName: meta("siteName"),
    },
  };
}

type Messages = {
  tagline: string;
  shop: string;
  about: string;
  contact: string;
  cart: string;
  siteName: string;
};
