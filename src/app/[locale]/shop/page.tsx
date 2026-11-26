"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import MainLayout from "@/components/MainLayout";
import BuyButton from "@/components/BuyButton";
import { Artwork } from "@/types/Artwork";

type Availability = "all" | "available" | "sold";

const AVAILABILITY: Availability[] = ["all", "available", "sold"];

type PriceRange = [number, number];

const PRICE_RANGES: { label: string; range: PriceRange }[] = [
  { label: "all", range: [0, 10000] },
  { label: "under500", range: [0, 500] },
  { label: "500to1000", range: [500, 1000] },
  { label: "over1000", range: [1000, 10000] },
];

const DEFAULT_PRICE: PriceRange = [0, 10000];

export default function Shop() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState("newest");
  const [availability, setAvailability] = useState<Availability>("available");
  const [priceRange, setPriceRange] = useState<PriceRange>(DEFAULT_PRICE);
  const t = useTranslations("ShopPage");

  useEffect(() => {
    const fetchArtworks = async () => {
      setIsLoading(true);
      try {
        // The whole collection, sold pieces included: the availability filter
        // decides what is shown, so sold work stays reachable here. This page
        // is the only place it appears.
        const response = await fetch("/api/artwork");
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

  const filteredArtworks = sortedArtworks.filter((artwork) => {
    if (availability === "available" && !artwork.inStock) return false;
    if (availability === "sold" && artwork.inStock) return false;
    return artwork.price >= priceRange[0] && artwork.price <= priceRange[1];
  });

  const isPriceActive = (range: PriceRange) =>
    priceRange[0] === range[0] && priceRange[1] === range[1];

  const pillClass = (active: boolean) =>
    `pill ${active ? "pill-active" : "pill-idle"}`;

  return (
    <MainLayout currentPath="/shop">
      <div className="page-shell page-width">
        <header className="page-header">
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-intro">{t("description")}</p>
        </header>

        {/* Filters. No group headings: the pill text names each group, and
            the headings cost more vertical weight than they earned. The names
            live on as accessible labels. */}
        <div className="card mb-10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-between">
            <div
              className="pill-group"
              role="group"
              aria-label={t("availability")}
            >
              {AVAILABILITY.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAvailability(option)}
                  aria-pressed={availability === option}
                  className={pillClass(availability === option)}
                >
                  {t(`filters.${option}`)}
                </button>
              ))}
            </div>

            <div
              className="pill-group flex-wrap"
              role="group"
              aria-label={t("price")}
            >
              {PRICE_RANGES.map(({ label, range }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPriceRange(range)}
                  aria-pressed={isPriceActive(range)}
                  className={pillClass(isPriceActive(range))}
                >
                  {t(label)}
                </button>
              ))}
            </div>

            {/* The visible label is gone, so the select carries its own. */}
            <select
              aria-label={t("sort")}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="field w-auto cursor-pointer px-3.5 py-1.5 text-xs"
            >
              <option value="newest">{t("newest")}</option>
              <option value="oldest">{t("oldest")}</option>
              <option value="price-low">{t("price-asc")}</option>
              <option value="price-high">{t("price-desc")}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner h-10 w-10" />
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-6 text-lg font-light text-ink-soft">
              {t("noArtworks")}
            </p>
            <button
              onClick={() => {
                setSortOption("newest");
                setAvailability("all");
                setPriceRange(DEFAULT_PRICE);
              }}
              className="btn btn-primary"
            >
              {t("removeFilters")}
            </button>
          </div>
        ) : (
          <>
            <p className="meta-text mb-6">
              {filteredArtworks.length} {t("nrOfArtworks")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArtworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="card card-interactive group flex flex-col overflow-hidden"
                >
                  {/* The link covers the image and the details; the buy button
                      sits outside it, so no control is nested in an anchor. */}
                  <Link href={`/artwork/${artwork.slug}`} className="block">
                    {/* contain, not cover: these are artworks of varying
                        proportions, and cropping one is worse than letterboxing
                        it. The neutral panel makes the spare space deliberate. */}
                    <div className="media-frame h-72 rounded-b-none p-3">
                      {artwork.images && artwork.images[0] ? (
                        <Image
                          src={artwork.images[0].url}
                          alt={artwork.images[0].alt || artwork.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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

                    <div className="card-pad pb-3">
                      <h2 className="mb-1 truncate font-display text-lg font-normal tracking-wide text-ink">
                        {artwork.title}
                      </h2>
                      <p className="meta-text mb-2">
                        {artwork.medium}, {artwork.year}
                      </p>
                      <p className="font-light text-ink-soft">
                        {artwork.price} EUR
                      </p>
                    </div>
                  </Link>

                  <div className="mt-auto px-5 pb-5 lg:px-6 lg:pb-6">
                    <BuyButton
                      artworkId={artwork.id}
                      inStock={artwork.inStock}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Commission CTA */}
        <section className="card panel-pad mt-14 text-center lg:mt-20">
          <h2 className="section-title mb-4">{t("ctaTitle")}</h2>
          <p className="mx-auto mb-8 max-w-2xl font-light leading-relaxed text-ink-soft">
            {t("ctaText")}
          </p>
          <Link href="/contact" className="btn btn-primary">
            {t("ctaButton")}
          </Link>
        </section>
      </div>
    </MainLayout>
  );
}
