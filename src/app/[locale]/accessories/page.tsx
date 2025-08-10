"use client";

import MainLayout from "@/components/MainLayout";
import CategoryGallery from "@/components/CategoryGallery";
import { useTranslations } from "next-intl";

export default function AccessoriesPage() {
  const t = useTranslations("CategoryPages");

  return (
    <MainLayout currentPath="/accessories">
      <CategoryGallery
        category="accessories"
        title={t("accessories.title")}
        description={t("accessories.description")}
      />
    </MainLayout>
  );
}
