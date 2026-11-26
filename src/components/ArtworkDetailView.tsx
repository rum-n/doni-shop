"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MainLayout from "@/components/MainLayout";
import { Artwork } from "@/types/Artwork";
import BuyButton from "@/components/BuyButton";
import AddToCartButton from "@/components/AddToCartButton";
import ImageGallery from "@/components/ImageGallery";
import { describeArtwork } from "@/lib/artwork";

/**
 * The interactive half of the artwork page.
 *
 * The artwork is fetched on the server and handed down, so the markup a
 * crawler sees is the finished page rather than a spinner.
 */
export default function ArtworkDetailView({ artwork }: { artwork: Artwork }) {
  const params = useParams();
  const slug = artwork.slug;
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("ArtworkPage");

  const getDescription = () => describeArtwork(artwork, locale);

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
                <span className="badge badge-unavailable absolute top-5 right-5">
                  {t("status.outOfStock")}
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
                  artwork.inStock ? "badge-quiet" : "badge-unavailable"
                }`}
              >
                {artwork.inStock ? t("status.available") : t("status.outOfStock")}
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
