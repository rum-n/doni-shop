"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";
import MainLayout from "@/components/MainLayout";

export default function About() {
  const [aboutContent, setAboutContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("AboutPage");

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const response = await fetch("/api/settings/about-me");
        const data = await response.json();
        setAboutContent(data.content || "");
      } catch (error) {
        console.error("Error fetching about content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAboutContent();
  }, []);

  return (
    <MainLayout currentPath="/about">
      <div className="page-shell page-width-narrow">
        <header className="page-header">
          <h1 className="page-title">{t("title")}</h1>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="spinner h-10 w-10" />
          </div>
        ) : aboutContent ? (
          <div className="rich-text text-base lg:text-lg">
            <ReactMarkdown>{aboutContent}</ReactMarkdown>
          </div>
        ) : (
          <p className="py-12 text-center font-light text-ink-muted">
            {t("empty")}
          </p>
        )}

        <div className="mt-14 border-t border-line pt-10 text-center lg:mt-20">
          <h2 className="section-title mb-6">{t("ctaTitle")}</h2>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/prints" className="btn btn-primary">
              {t("ctaPrints")}
            </Link>
            <Link href="/linocut-stamps" className="btn btn-secondary">
              {t("ctaLinocuts")}
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
