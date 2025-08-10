"use client";

import MainLayout from "@/components/MainLayout";
import CategoryGallery from "@/components/CategoryGallery";
import { useTranslations } from "next-intl";

export default function LinocutStampsPage() {
  const t = useTranslations("CategoryPages");

  return (
    <MainLayout currentPath="/linocut-stamps">
      <CategoryGallery
        category="linocut-stamps"
        title={t("linocutStamps.title")}
        description={t("linocutStamps.description")}
      />
    </MainLayout>
  );
}
