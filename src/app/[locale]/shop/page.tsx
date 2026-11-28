import MainLayout from "@/components/MainLayout";
import ShopView from "@/components/ShopView";
import { listArtworks } from "@/lib/artwork-lookup";

type Params = Promise<{ locale: string }>;

export default async function ShopPage({ params }: { params: Params }) {
  await params;

  // The whole collection, out-of-stock pieces included: the availability
  // filter in ShopView decides what is shown, and this page is the only place
  // unavailable work appears.
  const artworks = await listArtworks();

  return (
    <MainLayout currentPath="/shop">
      <ShopView artworks={artworks} />
    </MainLayout>
  );
}
