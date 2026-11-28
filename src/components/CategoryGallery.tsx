import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Artwork } from "@/types/Artwork";

interface CategoryGalleryProps {
  artworks: Artwork[];
  locale: string;
  title: string;
  description?: string;
}

/**
 * A category's artworks.
 *
 * A server component: the artworks arrive as a prop, so there is no fetching
 * state left and the grid is in the HTML on first paint.
 */
export default async function CategoryGallery({
  artworks,
  locale,
  title,
  description,
}: CategoryGalleryProps) {
  const t = await getTranslations({ locale, namespace: "CategoryPages" });
  const artworkPairs = [];
  for (let i = 0; i < artworks.length; i += 2) {
    artworkPairs.push(artworks.slice(i, i + 2));
  }

  return (
    <div className="page-shell page-width">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-intro">{description}</p>}
      </header>

      {artworks.length > 0 ? (
        /* Artwork Grid - Rows of Two Centered */
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col space-y-8 lg:space-y-12">
            {artworkPairs.map((pair, rowIndex) => (
              <div
                key={rowIndex}
                className={`flex flex-col lg:flex-row gap-6 lg:gap-12 justify-center items-center ${
                  pair.length === 1 ? "lg:justify-center" : ""
                }`}
              >
                {pair.map((artwork) => (
                  <Link
                    key={artwork.id}
                    href={`/artwork/${artwork.slug}`}
                    className="group block w-full max-w-md lg:max-w-lg"
                  >
                    <div className="card card-interactive overflow-hidden">
                      {/* contain rather than cover, so no artwork is cropped */}
                      <div className="media-frame h-64 rounded-b-none p-3 sm:h-80 lg:h-96">
                        {artwork.images && artwork.images[0] ? (
                          <Image
                            src={artwork.images[0].url}
                            alt={artwork.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 512px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="font-light text-ink-faint">
                              {t("noImage")}
                            </span>
                          </div>
                        )}
                        {!artwork.inStock && (
                          <span className="badge badge-unavailable absolute top-4 right-4">
                            {t("outOfStockBadge")}
                          </span>
                        )}
                      </div>
                      <div className="card-pad">
                        <h2 className="mb-2 font-display text-lg font-normal tracking-wide text-ink transition-colors group-hover:text-ink-muted lg:text-xl">
                          {artwork.title}
                        </h2>
                        <p className="meta-text mb-3">
                          {artwork.medium}, {artwork.year}
                        </p>
                        <p className="text-lg font-light text-ink-soft">
                          {artwork.price} EUR
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Empty State */}
      {artworks.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg font-light text-ink-muted">{t("noArtworks")}</p>
        </div>
      )}
    </div>
  );
}
