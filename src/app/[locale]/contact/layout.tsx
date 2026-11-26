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
  const t = await getTranslations({ locale, namespace: "ContactPage" });

  return pageMetadata({
    locale,
    path: "/contact",
    titleKey: t("title"),
    descriptionKey: "contact",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
