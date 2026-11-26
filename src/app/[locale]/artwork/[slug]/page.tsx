"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MainLayout from "@/components/MainLayout";
import { Artwork } from "@/types/Artwork";
import BuyButton from "@/components/BuyButton";
import AddToCartButton from "@/components/AddToCartButton";
import ImageGallery from "@/components/ImageGallery";

export default function ArtworkDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string;
  const t = useTranslations("ArtworkPage");

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtwork = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/artwork/${slug}`);

        if (!response.ok) {
          throw new Error("Artwork not found");
        }

        const data = await response.json();
        setArtwork(data.artwork);
      } catch (err) {
        console.error("Error fetching artwork:", err);
        setError("Failed to load artwork details");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchArtwork();
    }
  }, [slug]);

  // Get the appropriate description based on locale
  const getDescription = () => {
    if (!artwork) return "";

    // Handle both old string format and new object format
    if (typeof artwork.description === "string") {
      return artwork.description;
    }

    // New multi-language format
    if (
      typeof artwork.description === "object" &&
      artwork.description !== null
    ) {
      return locale === "bg" ? artwork.description.bg : artwork.description.en;
    }

    return "";
  };

  // Get category name for back button
  const getCategoryName = () => {
    if (!artwork?.category) return "Prints";

    switch (artwork.category) {
      case "linocut-stamps":
        return locale === "bg" ? "Линогравюри" : "Linocut Stamps";
      case "accessories":
        return locale === "bg" ? "Аксесоари" : "Accessories";
      default:
        return locale === "bg" ? "Принтове" : "Prints";
    }
  };

  if (isLoading) {
    return (
      <MainLayout currentPath={`/artwork/${slug}`}>
        <div className="flex h-64 items-center justify-center">
          <div className="spinner h-10 w-10" />
        </div>
      </MainLayout>
    );
  }

  if (error || !artwork) {
    return (
      <MainLayout currentPath={`/artwork/${slug}`}>
        <div className="page-shell text-center">
          <h1 className="section-title mb-4">Error</h1>
          <p className="mb-8 font-light text-ink-muted">
            {error || "Artwork not found"}
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentPath={`/artwork/${slug}`}>
      <div className="page-shell page-width">
        <div className="mb-8 lg:mb-10">
          <Link
            href={`/${artwork.category || "prints"}`}
            className="flex items-center font-light tracking-wide text-ink-soft transition-colors hover:text-ink"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            {t("buttons.back")} {getCategoryName()}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Artwork Images */}
          <div className="artwork-images">
            <div className="card relative mb-6 overflow-hidden p-2 lg:p-3">
              {artwork.images && artwork.images.length > 0 ? (
                <ImageGallery images={artwork.images} title={artwork.title} />
              ) : (
                <div className="media-frame flex aspect-square items-center justify-center">
                  <span className="font-light text-ink-faint">
                    {t("noImage")}
                  </span>
                </div>
              )}
              {!artwork.inStock && (
                <span className="badge badge-sold absolute top-5 right-5">
                  {t("status.sold")}
                </span>
              )}
              {artwork.featured && (
                <span className="badge badge-quiet absolute top-5 left-5">
                  {t("status.featured")}
                </span>
              )}
            </div>

          </div>

          {/* Artwork Details */}
          <div className="artwork-details">
            <h1 className="mb-4 font-display text-3xl font-normal tracking-wide text-ink lg:text-4xl">
              {artwork.title}
            </h1>

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <p className="font-light text-ink-soft">
                {artwork.medium}, {artwork.year}
              </p>
              <span
                className={`badge w-fit ${
                  artwork.inStock ? "badge-quiet" : "badge-sold"
                }`}
              >
                {artwork.inStock ? t("status.available") : t("status.sold")}
              </span>
            </div>

            <p className="mb-8 font-display text-2xl font-normal text-ink lg:text-3xl">
              {artwork.price} EUR
            </p>

            <div className="mb-8 lg:mb-10">
              <h2 className="section-title mb-4">
                {t("sections.description")}
              </h2>
              <p className="font-light leading-relaxed whitespace-pre-line text-ink-soft">
                {getDescription()}
              </p>
            </div>

            <div className="mb-8 lg:mb-10">
              <h2 className="section-title mb-4">{t("sections.details")}</h2>
              <ul className="space-y-3">
                {artwork.dimensions && (
                  <li className="flex flex-col sm:flex-row">
                    <span className="mb-1 w-32 font-light text-ink sm:mb-0">
                      {t("details.dimensions")}
                    </span>
                    <span className="font-light text-ink-soft">
                      {artwork.dimensions.width} × {artwork.dimensions.height}{" "}
                      {artwork.dimensions.unit}
                    </span>
                  </li>
                )}
                <li className="flex flex-col sm:flex-row">
                  <span className="mb-1 w-32 font-light text-ink sm:mb-0">
                    {t("details.medium")}
                  </span>
                  <span className="font-light text-ink-soft">
                    {artwork.medium}
                  </span>
                </li>
                <li className="flex flex-col sm:flex-row">
                  <span className="mb-1 w-32 font-light text-ink sm:mb-0">
                    {t("details.year")}
                  </span>
                  <span className="font-light text-ink-soft">
                    {artwork.year}
                  </span>
                </li>
              </ul>
            </div>

            {artwork.inStock && (
              <div className="mb-8 lg:mb-10 space-y-3">
                <BuyButton artworkId={artwork.id} inStock={artwork.inStock} />
                <AddToCartButton
                  inStock={artwork.inStock}
                  item={{
                    id: artwork.id,
                    slug: artwork.slug,
                    title: artwork.title,
                    price: artwork.price,
                    image: artwork.images?.[0]?.url ?? null,
                  }}
                />
                <p className="meta-text pt-1">
                  {t("checkout.secure")}
                </p>
              </div>
            )}

            <div className="border-t border-line pt-8 lg:pt-10">
              <h2 className="section-title mb-4">
                {t("sections.questions")}
              </h2>
              <p className="mb-6 font-light leading-relaxed text-ink-soft">
                {t("contact.text")}
              </p>
              <Link href="/contact" className="btn btn-secondary">
                {t("contact.button")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
