import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";

// A "use client" page cannot export metadata, so it lives in the segment's
// layout instead. Keeps the page itself untouched.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ShopPage" });

  return pageMetadata({
    locale,
    path: "/shop",
    titleKey: t("title"),
    descriptionKey: "shop",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
