"use client";

// import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
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
      <div className="p-12">
        {/* Hero Section */}
        <section className="relative h-96 rounded-3xl overflow-hidden mb-20">
          {heroImage ? (
            <div className="absolute inset-0">
              <Image
                src={heroImage}
                alt="Hero Image"
                fill
                priority
                style={{ objectFit: "cover" }}
              />
              {/* Overlay to ensure text is readable */}
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ) : (
            <div></div>
          )}

          <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-8">
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
