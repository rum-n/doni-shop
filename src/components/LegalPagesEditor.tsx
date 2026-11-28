"use client";

import { useCallback, useEffect, useState } from "react";
import LocalizedMarkdownEditor from "@/components/LocalizedMarkdownEditor";
import { EMPTY_LOCALIZED, type LocalizedText } from "@/lib/localized-setting";
import { LEGAL_PAGES, type LegalPage } from "@/lib/legal";

const PAGE_LABELS: Record<LegalPage, string> = {
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
  returns: "Returns & Refunds",
};

/**
 * Edits the three policy pages.
 *
 * One page at a time: three bilingual markdown editors at once would make the
 * settings page unusable.
 */
export default function LegalPagesEditor() {
  const [page, setPage] = useState<LegalPage>("terms");
  const [content, setContent] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (which: LegalPage) => {
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/settings/legal?page=${which}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setContent(data.content ?? EMPTY_LOCALIZED);
      setIsDefault(Boolean(data.isDefault));
    } catch (err) {
      console.error("Could not load the page:", err);
      setError("Could not load this page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/settings/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, content }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save");

      setIsDefault(false);
      setMessage(`${PAGE_LABELS[page]} saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Each page starts as a skeleton of the headings an EU distance seller has
        to cover. Replace every square-bracketed placeholder, then have the text
        reviewed — it is a starting point, not legal advice. Markdown links like{" "}
        <code className="bg-gray-100 px-1">[returns](/returns)</code> work.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {LEGAL_PAGES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPage(option)}
            aria-pressed={page === option}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              page === option
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {PAGE_LABELS[option]}
          </button>
        ))}
      </div>

      {isDefault && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded mb-4 text-sm">
          This page has never been saved. Visitors see a notice saying it is not
          final until you edit and save it.
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-[400px] bg-gray-50 border border-gray-300 rounded-md">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <LocalizedMarkdownEditor
          // Remount when the page changes, so the editor reloads its markdown.
          key={page}
          id={`legal-${page}`}
          value={content}
          onChange={setContent}
        />
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 mt-6"
      >
        {isSaving ? "Saving..." : `Save ${PAGE_LABELS[page]}`}
      </button>
    </div>
  );
}
