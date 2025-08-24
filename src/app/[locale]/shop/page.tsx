"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Artwork } from "@/types/Artwork";
import BuyButton from "@/components/BuyButton";
import { useTranslations } from "next-intl";

export default function Shop() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const t = useTranslations("ShopPage");

  useEffect(() => {
    const fetchArtworks = async () => {
      setIsLoading(true);
      try {
        // Fetch only available artworks
        const response = await fetch("/api/artwork?featured=true&inStock=true");
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
  }, []);

  // Sort artworks based on selected option
  const sortedArtworks = [...artworks].sort((a, b) => {
    switch (sortOption) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return (
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt || "").getTime() -
          new Date(b.createdAt || "").getTime()
        );
      default:
        return 0;
    }
  });

  const filteredArtworks = sortedArtworks.filter(
    (artwork) =>
      artwork.price >= priceRange[0] && artwork.price <= priceRange[1]
  );

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  return (
    <>
      <Navbar currentPath="/shop" />

      <main className="container mx-auto px-4 py-8">
        <section className="shop-filters mb-8">
          <div className="p-6 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label
                      htmlFor="sort"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t("sort")}
                    </label>
                    <select
                      id="sort"
                      value={sortOption}
                      onChange={handleSortChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-7 px-1"
                    >
                      <option value="newest">{t("newest")}</option>
                      <option value="oldest">{t("oldest")}</option>
                      <option value="price-low">{t("price-asc")}</option>
                      <option value="price-high">{t("price-desc")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  {t("price")}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePriceRangeChange(0, 10000)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      priceRange[0] === 0 && priceRange[1] === 10000
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    {t("all")}
                  </button>
                  <button
                    onClick={() => handlePriceRangeChange(0, 500)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      priceRange[0] === 0 && priceRange[1] === 500
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    {t("under500")}
                  </button>
                  <button
                    onClick={() => handlePriceRangeChange(500, 1000)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      priceRange[0] === 500 && priceRange[1] === 1000
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    {t("500to1000")}
                  </button>
                  <button
                    onClick={() => handlePriceRangeChange(1000, 10000)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      priceRange[0] === 1000 && priceRange[1] === 10000
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    {t("over1000")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <section className="artwork-grid">
            {filteredArtworks.length > 0 ? (
              <>
                <p className="text-gray-600 mb-4">
                  {filteredArtworks.length} {t("nrOfArtworks")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredArtworks.map((artwork) => (
                    <div
                      key={artwork.id}
                      className="artwork-card border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-64">
                        {artwork.images && artwork.images[0] ? (
                          <Image
                            src={artwork.images[0].url}
                            alt={artwork.images[0].alt || artwork.title}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">
                              {t("noImage")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-xl font-semibold">
                          {artwork.title}
                        </h3>
                        <p className="text-gray-600">
                          {artwork.medium}, {artwork.year}
                        </p>
                        <p className="text-lg font-bold mt-2">
                          {artwork.price} EUR
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
                          <Link
                            href={`/artwork/${artwork.slug}`}
                            className="text-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition w-50 flex justify-center items-center"
                          >
                            {t("seeMore")}
                          </Link>
                          <BuyButton
                            artworkId={artwork.id}
                            inStock={artwork.inStock}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">{t("noArtworks")}</p>
                <button
                  onClick={() => {
                    setSortOption("newest");
                    setPriceRange([0, 10000]);
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  {t("removeFilters")}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="commission-cta mt-16 bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
          <h2 className="text-2xl font-bold mb-4">{t("ctaTitle")}</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">{t("ctaText")}</p>
          <Link
            href="/contact"
            className="bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-900 transition"
          >
            {t("ctaButton")}
          </Link>
        </section>
      </main>
    </>
  );
}
