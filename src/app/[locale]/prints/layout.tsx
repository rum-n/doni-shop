import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CategoryPages" });

  return pageMetadata({
    locale,
    path: "/prints",
    titleKey: t("prints.title"),
    // The category's own blurb is a better description than a generic one.
    descriptionKey: "shop",
    override: t("prints.description"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
