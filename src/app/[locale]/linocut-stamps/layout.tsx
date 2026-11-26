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
    path: "/linocut-stamps",
    titleKey: t("linocutStamps.title"),
    // The category's own blurb is a better description than a generic one.
    descriptionKey: "shop",
    override: t("linocutStamps.description"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
