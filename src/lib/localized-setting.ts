import { routing } from "@/i18n/routing";

/** Rich-text site copy, one entry per locale. */
export type LocalizedText = { en: string; bg: string };

export const EMPTY_LOCALIZED: LocalizedText = { en: "", bg: "" };

/**
 * Reads a SiteSettings value into per-locale text.
 *
 * Three shapes have to survive here: the current `{ en, bg }`, the older
 * single-language `{ content }`, and a bare string from before that. Legacy
 * copy is treated as English with Bulgarian left empty, so the admin shows an
 * obvious gap to fill rather than English text pretending to be a translation.
 * `pickLocale` below keeps Bulgarian visitors reading the English in the
 * meantime.
 */
export function readLocalizedText(value: unknown): LocalizedText {
  if (typeof value === "string") {
    return { en: value, bg: "" };
  }

  if (!value || typeof value !== "object") {
    return { ...EMPTY_LOCALIZED };
  }

  const raw = value as Record<string, unknown>;

  // Current shape
  if (typeof raw.en === "string" || typeof raw.bg === "string") {
    return {
      en: typeof raw.en === "string" ? raw.en : "",
      bg: typeof raw.bg === "string" ? raw.bg : "",
    };
  }

  // Single-language shape
  if (typeof raw.content === "string") {
    return { en: raw.content, bg: "" };
  }

  return { ...EMPTY_LOCALIZED };
}

/** Normalises whatever the admin submitted into storable per-locale text. */
export function writeLocalizedText(body: unknown): LocalizedText | null {
  if (!body || typeof body !== "object") return null;

  const raw = body as Record<string, unknown>;

  // Current shape: at least one locale must be present.
  if (typeof raw.en === "string" || typeof raw.bg === "string") {
    return {
      en: typeof raw.en === "string" ? raw.en : "",
      bg: typeof raw.bg === "string" ? raw.bg : "",
    };
  }

  // Accept a single-language payload so an older client still saves something
  // rather than failing.
  if (typeof raw.content === "string") {
    return { en: raw.content, bg: "" };
  }

  return null;
}

/**
 * Picks the text for a locale, falling back to the other language.
 *
 * An untranslated page is better than a blank one: a Bulgarian visitor sees
 * the English copy until a translation exists.
 */
export function pickLocale(text: LocalizedText, locale: string): string {
  const preferred = locale === "bg" ? text.bg : text.en;
  const fallback = locale === "bg" ? text.en : text.bg;
  return preferred?.trim() ? preferred : fallback || "";
}

/** The locales the admin offers an editor for. */
export const CONTENT_LOCALES = routing.locales;
