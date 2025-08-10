"use client";

import MainLayout from "@/components/MainLayout";
import CategoryGallery from "@/components/CategoryGallery";
import { useTranslations } from "next-intl";

export default function PrintsPage() {
  const t = useTranslations("CategoryPages");

  return (
    <MainLayout currentPath="/prints">
      <CategoryGallery
        category="prints"
        title={t("prints.title")}
        description={t("prints.description")}
      />
    </MainLayout>
  );
}
