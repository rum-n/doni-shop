"use client";

import { useTranslations } from "next-intl";
import MainLayout from "@/components/MainLayout";

// Set NEXT_PUBLIC_CONTACT_EMAIL to show an email address here. Without it the
// page still works and points visitors at the social accounts instead.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const SOCIALS = [
  { name: "Instagram", url: "https://www.instagram.com/nordkinsart" },
  { name: "Facebook", url: "https://facebook.com/doniboyadzhieva" },
  { name: "Pinterest", url: "https://pinterest.com/doniboyadzhieva" },
];

export default function ContactPage() {
  const t = useTranslations("ContactPage");

  return (
    <MainLayout currentPath="/contact">
      <div className="page-shell page-width-narrow">
        <header className="page-header">
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-intro">{t("intro")}</p>
        </header>

        <div className="card panel-pad">
          {CONTACT_EMAIL ? (
            <div className="text-center">
              <h2 className="eyebrow mb-3">{t("emailLabel")}</h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="break-all font-display text-xl font-normal text-ink transition-colors hover:text-ink-muted lg:text-2xl"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="meta-text mt-4">{t("responseTime")}</p>
            </div>
          ) : (
            <p className="text-center font-light leading-relaxed text-ink-soft">
              {t("noEmail")}
            </p>
          )}

          <div className="mt-10 border-t border-line pt-8 text-center">
            <h2 className="eyebrow mb-4">{t("socialsLabel")}</h2>
            <div className="flex flex-wrap justify-center gap-3">
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
