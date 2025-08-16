"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/components/MainLayout";
import { Artwork } from "@/types/Artwork";
import BuyButton from "@/components/BuyButton";
import ImageGallery from "@/components/ImageGallery";

export default function ArtworkDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);
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

  if (isLoading) {
    return (
      <MainLayout currentPath={`/artwork/${slug}`}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-300"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !artwork) {
    return (
      <MainLayout currentPath={`/artwork/${slug}`}>
        <div className="p-4 lg:p-12 text-center">
          <h1 className="text-2xl font-playfair-regular text-slate-600 mb-4">
            Error
          </h1>
          <p className="mb-8 text-slate-500">{error || "Artwork not found"}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentPath={`/artwork/${slug}`}>
      <div className="p-4 lg:p-12">
        <div className="mb-8 lg:mb-12">
          <Link
            href={`/${artwork.category || "prints"}`}
            className="text-slate-600 hover:text-slate-800 flex items-center font-light tracking-wide"
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
            Back to{" "}
            {artwork.category === "linocut-stamps"
              ? "Linocut Stamps"
              : artwork.category === "accessories"
              ? "Accessories"
              : "Prints"}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Artwork Images */}
          <div className="artwork-images">
            <div className="relative h-80 lg:h-[600px] mb-6 rounded-2xl overflow-hidden shadow-lg bg-white/80 backdrop-blur-sm border border-slate-200">
              {artwork.images && artwork.images.length > 0 ? (
                <ImageGallery images={artwork.images} title={artwork.title} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center">
                  <span className="text-slate-400 font-light">
                    No image available
                  </span>
                </div>
              )}
              {!artwork.inStock && (
                <div className="absolute top-6 right-6 bg-slate-600 text-white px-4 py-2 rounded-full text-sm font-light">
                  SOLD
                </div>
              )}
              {artwork.featured && (
                <div className="absolute top-6 left-6 bg-slate-500 text-white px-4 py-2 rounded-full text-sm font-light">
                  FEATURED
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {artwork.images && artwork.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {artwork.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0 rounded-xl overflow-hidden ${
                      selectedImage === index
                        ? "ring-2 ring-slate-400"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${artwork.title} - view ${index + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Artwork Details */}
          <div className="artwork-details">
            <h1 className="text-3xl lg:text-4xl font-playfair-regular text-slate-800 mb-4 tracking-wide">
              {artwork.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center mb-6 space-y-2 sm:space-y-0">
              <p className="text-slate-600 sm:mr-6 font-light">
                {artwork.medium}, {artwork.year}
              </p>
              <span
                className={`px-3 py-1 text-xs font-light rounded-full w-fit ${
                  artwork.inStock
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {artwork.inStock ? "Available" : "Sold"}
              </span>
            </div>

            <p className="text-2xl lg:text-3xl font-light text-slate-700 mb-8">
              ${artwork.price}
            </p>

            <div className="prose max-w-none mb-8 lg:mb-10">
              <h3 className="text-xl lg:text-2xl font-playfair-regular text-slate-800 mb-4">
                Description
              </h3>
              <p className="text-slate-600 leading-relaxed font-light whitespace-pre-line">
                {getDescription()}
              </p>
            </div>

            <div className="mb-8 lg:mb-10">
              <h3 className="text-xl lg:text-2xl font-playfair-regular text-slate-800 mb-4">
                Details
              </h3>
              <ul className="space-y-3">
                {artwork.dimensions && (
                  <li className="flex flex-col sm:flex-row">
                    <span className="font-light text-slate-700 w-32 mb-1 sm:mb-0">
                      Dimensions:
                    </span>
                    <span className="text-slate-600 font-light">
                      {artwork.dimensions.width} × {artwork.dimensions.height}{" "}
                      {artwork.dimensions.unit}
                    </span>
                  </li>
                )}
                <li className="flex flex-col sm:flex-row">
                  <span className="font-light text-slate-700 w-32 mb-1 sm:mb-0">
                    Medium:
                  </span>
                  <span className="text-slate-600 font-light">
                    {artwork.medium}
                  </span>
                </li>
                <li className="flex flex-col sm:flex-row">
                  <span className="font-light text-slate-700 w-32 mb-1 sm:mb-0">
                    Year:
                  </span>
                  <span className="text-slate-600 font-light">
                    {artwork.year}
                  </span>
                </li>
              </ul>
            </div>

            {artwork.inStock && (
              <div className="mb-8 lg:mb-10">
                <BuyButton artworkId={artwork.id} inStock={artwork.inStock} />
                <p className="text-sm text-slate-500 mt-4 font-light">
                  Secure checkout • Shipping available worldwide
                </p>
              </div>
            )}

            <div className="pt-8 lg:pt-10 border-t border-slate-200">
              <h3 className="text-xl lg:text-2xl font-playfair-regular text-slate-800 mb-4">
                Have Questions?
              </h3>
              <p className="mb-6 text-slate-600 font-light leading-relaxed">
                Contact the artist for inquiries about this artwork, commission
                requests, or shipping details.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-slate-50 border border-slate-200 text-slate-700 px-6 py-3 rounded-full hover:bg-slate-100 transition-all duration-300 font-light tracking-wide"
              >
                Contact the Artist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
