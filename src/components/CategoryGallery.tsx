"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    <div className="p-4 lg:p-12">
      {/* Header */}
      <div className="mb-8 lg:mb-16 text-center">
        <h1 className="text-3xl lg:text-5xl font-playfair-regular text-slate-800 mb-4 lg:mb-6 tracking-wide">
          {title}
        </h1>
        {description && (
          <p className="text-lg lg:text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed px-4">
            {description}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-300"></div>
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
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 border border-slate-200 hover:border-slate-300">
                      <div className="relative h-64 sm:h-80 lg:h-96">
                        {artwork.images && artwork.images[0] ? (
                          <Image
                            src={artwork.images[0].url}
                            alt={artwork.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center">
                            <span className="text-slate-400 font-light">
                              No image available
                            </span>
                          </div>
                        )}
                        {!artwork.inStock && (
                          <div className="absolute top-4 right-4 bg-slate-600 text-white px-3 py-1 rounded-full text-sm font-light">
                            SOLD
                          </div>
                        )}
                      </div>
                      <div className="p-4 lg:p-6">
                        <h3 className="text-lg lg:text-xl font-playfair-regular text-slate-800 mb-2 group-hover:text-slate-600 transition-colors">
                          {artwork.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3 font-light">
                          {artwork.medium}, {artwork.year}
                        </p>
                        <p className="text-lg font-light text-slate-700">
                          ${artwork.price}
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
        <div className="text-center py-16">
          <p className="text-xl text-slate-500 font-light">
            No artworks found in this category.
          </p>
        </div>
      )}
    </div>
  );
}
