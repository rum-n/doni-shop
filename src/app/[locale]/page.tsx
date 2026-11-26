"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import MainLayout from "@/components/MainLayout";
import VideoBackground from "@/components/VideoBackground";

export default function Home() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [homepageContent, setHomepageContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/settings/hero-image");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        setHeroImage(data.imageUrl ?? null);
        // The endpoint returns this already flattened to a string. It used to
        // be read as `.value.content`, which threw and left the hero blank.
        setHomepageContent(data.homepageContent || null);
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
          {homepageContent && (
            <div className="rich-text rich-text-invert max-w-2xl text-lg lg:text-xl">
              <ReactMarkdown>{homepageContent}</ReactMarkdown>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
