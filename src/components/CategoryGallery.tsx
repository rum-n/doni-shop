"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Artwork } from "@/types/Artwork";

interface CategoryGalleryProps {
  category: string;
  title: string;
  description?: string;
}

export default function CategoryGallery({
  category,
  title,
  description,
}: CategoryGalleryProps) {
  const t = useTranslations("CategoryPages");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/artwork?category=${category}&inStock=true`
        );
        const data = await response.json();

        if (data.artworks) {
          setArtworks(data.artworks);
        }
      } catch (error) {
        console.error("Error fetching artworks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtworks();
  }, [category]);

  // Group artworks into pairs for rows of two
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="spinner h-10 w-10" />
        </div>
      ) : (
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
                          <span className="badge badge-sold absolute top-4 right-4">
                            {t("soldBadge")}
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
      )}

      {/* Empty State */}
      {!isLoading && artworks.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg font-light text-ink-muted">{t("noArtworks")}</p>
        </div>
      )}
    </div>
  );
}
