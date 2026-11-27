"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";
import MainLayout from "@/components/MainLayout";
import InstagramStrip from "@/components/InstagramStrip";
import { INSTAGRAM_PROFILE } from "@/lib/instagram";
import {
  EMPTY_LOCALIZED,
  pickLocale,
  type LocalizedText,
} from "@/lib/localized-setting";

// Set NEXT_PUBLIC_CONTACT_EMAIL to show an email address. Without it the page
// still works and points visitors at the social accounts instead.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const SOCIALS = [
  { name: "Instagram", url: INSTAGRAM_PROFILE },
  { name: "Facebook", url: "https://facebook.com/doniboyadzhieva" },
  { name: "Pinterest", url: "https://pinterest.com/doniboyadzhieva" },
];

export default function About() {
  const [aboutContent, setAboutContent] =
    useState<LocalizedText>(EMPTY_LOCALIZED);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("AboutPage");
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  // Falls back to the other language while a translation is missing, so the
  // page is never blank just because one locale is unwritten.
  const body = pickLocale(aboutContent, locale);

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const response = await fetch("/api/settings/about-me");
        const data = await response.json();
        setAboutContent(data.content ?? EMPTY_LOCALIZED);
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
        ) : body ? (
          <div className="rich-text text-base lg:text-lg">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        ) : (
          <p className="py-12 text-center font-light text-ink-muted">
            {t("empty")}
          </p>
        )}

        {/* Absorbed from the old /contact page, which now redirects here. */}
        <section className="mt-14 border-t border-line pt-10 lg:mt-20">
          <h2 className="section-title mb-3">{t("contactTitle")}</h2>
          <p className="mb-6 font-light leading-relaxed text-ink-soft">
            {t("contactText")}
          </p>

          {CONTACT_EMAIL ? (
            <div className="mb-8">
              <h3 className="eyebrow mb-2">{t("emailLabel")}</h3>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-display text-xl font-normal break-all text-ink transition-colors hover:text-ink-muted"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="meta-text mt-2">{t("responseTime")}</p>
            </div>
          ) : (
            <p className="mb-8 font-light leading-relaxed text-ink-soft">
              {t("noEmail")}
            </p>
          )}

          <h3 className="eyebrow mb-3">{t("socialsLabel")}</h3>
          <div className="flex flex-wrap gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary px-5 py-2 text-sm"
              >
                {social.name}
              </a>
            ))}
          </div>
        </section>

        <InstagramStrip />

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
