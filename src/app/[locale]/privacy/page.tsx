import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPageView from "@/components/LegalPageView";
import { pageMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });

  return pageMetadata({
    locale,
    path: "/privacy",
    titleKey: t("privacy"),
    descriptionKey: "tagline",
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  return <LegalPageView page="privacy" locale={locale} />;
}
