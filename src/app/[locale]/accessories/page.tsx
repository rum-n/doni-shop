import { getTranslations } from "next-intl/server";
import MainLayout from "@/components/MainLayout";
import CategoryGallery from "@/components/CategoryGallery";
import { listArtworks } from "@/lib/artwork-lookup";

type Params = Promise<{ locale: string }>;

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CategoryPages" });

  // Read on the server, so the grid is in the HTML rather than arriving after
  // a client-side fetch.
  const artworks = await listArtworks({ category: "accessories", inStock: true });

  return (
    <MainLayout currentPath="/accessories">
      <CategoryGallery
        artworks={artworks}
        locale={locale}
        title={t("accessories.title")}
        description={t("accessories.description")}
      />
    </MainLayout>
  );
}
