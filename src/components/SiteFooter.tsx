"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LEGAL_PAGES } from "@/lib/legal";

/**
 * Site footer.
 *
 * Exists mainly to carry the policy links: an EU distance seller has to make
 * its terms, privacy policy and withdrawal rights findable from any page.
 */
export default function SiteFooter() {
  const t = useTranslations("Legal");
  const nav = useTranslations("Navigation");

  return (
    <footer className="border-t border-line bg-surface">
      <div className="page-width px-4 py-10 lg:px-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="font-display text-base tracking-wider text-ink uppercase">
              Doni Boyadzhieva
            </p>
            <p className="meta-text mt-2">© {new Date().getFullYear()}</p>
          </div>

          <nav aria-label={t("footerHeading")}>
            <h2 className="eyebrow mb-3">{t("footerHeading")}</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm font-light text-ink-soft transition-colors hover:text-ink"
                >
                  {nav("about")}
                </Link>
              </li>
              {LEGAL_PAGES.map((page) => (
                <li key={page}>
                  <Link
                    href={`/${page}`}
                    className="text-sm font-light text-ink-soft transition-colors hover:text-ink"
                  >
                    {t(page)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
