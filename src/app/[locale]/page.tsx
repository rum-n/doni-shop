"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import VideoBackground from "@/components/VideoBackground";
import ReactMarkdown from "react-markdown";
// import { useTranslations } from "next-intl";

export default function Home() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [homepageContent, setHomepageContent] = useState<string | null>(null);
  // const t = useTranslations("HomePage");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const heroResponse = await fetch("/api/settings/hero-image");
        const heroData = await heroResponse.json();

        if (heroData.imageUrl) {
          setHeroImage(heroData.imageUrl);
        } else {
          setHeroImage(null);
        }

        if (heroData.homepageContent) {
          setHomepageContent(heroData.homepageContent.value.content);
        } else {
          setHomepageContent(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <MainLayout currentPath="/">
      {/* Video Background */}
      <VideoBackground
        videoSrc="/home-vid.mp4"
        posterSrc="/home-vid.jpg"
        fallbackImage={heroImage || undefined}
        overlayOpacity={0.6}
      />

      {/* Content */}
      <div className="relative z-10 p-4 lg:p-12">
        {/* Hero Section */}
        <section className="relative h-64 lg:h-96 rounded-2xl lg:rounded-3xl overflow-hidden mb-12 lg:mb-20">
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 lg:px-8">
            {homepageContent && (
              <div className="text-white">
                <ReactMarkdown>{homepageContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
