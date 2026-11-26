"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

const LANGUAGE_STORAGE_KEY = "userLanguagePreference";

const LANGUAGES = [
  { code: "en", name: "EN" },
  { code: "bg", name: "BG" },
] as const;

function isSupported(code: string | null): boolean {
  return !!code && (routing.locales as readonly string[]).includes(code);
}

/** Swaps the locale segment of the current path, e.g. /en/prints → /bg/prints. */
function withLocale(pathname: string, locale: string): string {
  const stripped = pathname.replace(
    new RegExp(`^/(?:${routing.locales.join("|")})(?=/|$)`),
    ""
  );
  return `/${locale}${stripped || ""}`;
}

export default function LanguageSwitcher() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // The locale the page is actually rendered in, straight from next-intl, so
  // the label can never disagree with the URL.
  const currentLocale = useLocale();

  /**
   * Honour a saved preference once, on first load, and only when the URL does
   * not already match it. The previous version pushed a new route on every
   * mount, which quietly dragged visitors back to their stored language every
   * time they followed a link in the other one.
   */
  useEffect(() => {
    let saved: string | null = null;

    try {
      saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // Storage blocked: fall back to whatever the URL says.
      return;
    }

    if (!isSupported(saved)) {
      // Record where we ended up, so the next visit is stable.
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLocale);
      } catch {
        // Nothing to do; the switcher still works for this visit.
      }
      return;
    }

    if (saved !== currentLocale) {
      router.replace(withLocale(pathname, saved as string));
    }
    // First load only: re-running on navigation is what caused the old loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocaleChange = (locale: string) => {
    setIsDropdownOpen(false);

    if (locale === currentLocale) return;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    } catch {
      // The switch still works, it just will not be remembered.
    }

    router.push(withLocale(pathname, locale));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen((open) => !open)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        aria-label="Change language"
        className="flex cursor-pointer items-center rounded-full px-4 py-2 font-light tracking-wide text-ink-soft transition-all duration-300 hover:bg-surface-sunken hover:text-ink focus:outline-none"
      >
        <span>{currentLocale.toUpperCase()}</span>
        <svg
          className="ml-2 w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-24 rounded-media border border-line bg-surface/95 shadow-card-hover backdrop-blur-sm"
        >
          <div className="py-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                role="menuitem"
                onClick={() => handleLocaleChange(lang.code)}
                className={`block w-full cursor-pointer px-4 py-2 text-left text-sm font-light transition-colors duration-200 ${
                  currentLocale === lang.code
                    ? "bg-surface-sunken text-ink"
                    : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
