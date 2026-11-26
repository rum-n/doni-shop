"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: { url: string; alt?: string }[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="media-frame flex aspect-square items-center justify-center">
        <p className="font-light text-ink-faint">No image available</p>
      </div>
    );
  }

  const step = (delta: number) =>
    setCurrentIndex((prev) => (prev + delta + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* contain, not cover: the whole artwork, never a crop of it */}
      <div className="media-frame aspect-square p-3">
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || title}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 hidden -translate-y-1/2 cursor-pointer rounded-full border border-line bg-surface/80 p-2 text-ink-soft shadow-card backdrop-blur-sm transition-all duration-300 hover:bg-surface hover:text-ink md:block"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 hidden -translate-y-1/2 cursor-pointer rounded-full border border-line bg-surface/80 p-2 text-ink-soft shadow-card backdrop-blur-sm transition-all duration-300 hover:bg-surface hover:text-ink md:block"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
              className={`media-frame h-20 w-20 flex-shrink-0 cursor-pointer border transition-all duration-300 ${
                index === currentIndex
                  ? "border-accent opacity-100"
                  : "border-line opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${title} - image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
