"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CONTENT_LOCALES, type LocalizedText } from "@/lib/localized-setting";

const ClientMDXEditor = dynamic(() => import("@/components/ClientMDXEditor"), {
  ssr: false,
});

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  bg: "Български",
};

interface Props {
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  /** Distinguishes the editors when more than one is on the page. */
  id: string;
}

/**
 * One markdown editor per language, behind a tab strip.
 *
 * Tabs rather than two stacked editors: each MDXEditor is ~400px tall, and the
 * settings page already carries several. The `key` forces a remount on switch,
 * because MDXEditor takes its markdown as an initial value and will not pick
 * up a changed prop on its own.
 */
export default function LocalizedMarkdownEditor({
  value,
  onChange,
  id,
}: Props) {
  const [active, setActive] = useState<string>(CONTENT_LOCALES[0]);

  const current = (value[active as keyof LocalizedText] ?? "") as string;
  const missing = CONTENT_LOCALES.filter(
    (locale) => !(value[locale as keyof LocalizedText] ?? "").trim()
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex gap-1" role="tablist">
          {CONTENT_LOCALES.map((locale) => {
            const isEmpty = !(value[locale as keyof LocalizedText] ?? "").trim();

            return (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={active === locale}
                onClick={() => setActive(locale)}
                className={`rounded-t-md px-4 py-2 text-sm transition-colors ${
                  active === locale
                    ? "bg-white border border-gray-300 border-b-white text-gray-900 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {LOCALE_NAMES[locale] ?? locale.toUpperCase()}
                {isEmpty && (
                  <span
                    className="ml-2 text-xs text-amber-600"
                    title="No content yet"
                  >
                    ●
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {missing.length > 0 && missing.length < CONTENT_LOCALES.length && (
          <p className="text-xs text-gray-500">
            {missing.map((l) => LOCALE_NAMES[l] ?? l).join(", ")} not translated
            yet — visitors see the other language instead.
          </p>
        )}
      </div>

      <div className="border border-gray-300 rounded-md rounded-tl-none overflow-hidden">
        <ClientMDXEditor
          key={`${id}-${active}`}
          markdown={current}
          onChange={(markdown) =>
            onChange({ ...value, [active]: markdown } as LocalizedText)
          }
        />
      </div>
    </div>
  );
}
