"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import MainLayout from "@/components/MainLayout";
import VideoBackground from "@/components/VideoBackground";
import {
  EMPTY_LOCALIZED,
  pickLocale,
  type LocalizedText,
} from "@/lib/localized-setting";

export default function Home() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [homepageContent, setHomepageContent] =
    useState<LocalizedText>(EMPTY_LOCALIZED);
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const hero = pickLocale(homepageContent, locale);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/settings/hero-image");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        setHeroImage(data.imageUrl ?? null);
        // Per-locale copy; the endpoint normalises older single-language rows.
        setHomepageContent(data.homepageContent ?? EMPTY_LOCALIZED);
      } catch (error) {
        console.error("Error fetching homepage settings:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout currentPath="/">
      <VideoBackground
        videoSrc="/home-vid.mp4"
        posterSrc="/home-vid.jpg"
        fallbackImage={heroImage || undefined}
        overlayOpacity={0.6}
      />

      <div className="page-shell page-width relative z-10">
        <section className="flex min-h-[55vh] flex-col items-center justify-center text-center lg:min-h-[65vh]">
          {hero && (
            <div className="rich-text rich-text-invert max-w-2xl text-lg lg:text-xl">
              <ReactMarkdown>{hero}</ReactMarkdown>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
