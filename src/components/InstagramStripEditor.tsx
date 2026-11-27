"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ImageUploader from "@/components/ImageUploader";
import { STRIP_SIZE, type InstagramSlot } from "@/lib/instagram";

type Slot = { imageUrl: string; postUrl: string };

const EMPTY: Slot = { imageUrl: "", postUrl: "" };

/**
 * Curates the four images shown on the About page.
 *
 * Each slot pairs an uploaded image with the Instagram post it links to.
 * Instagram's CDN URLs expire and cannot be hotlinked, so the picture is
 * uploaded to Cloudinary rather than referenced from Instagram directly.
 */
export default function InstagramStripEditor() {
  const [slots, setSlots] = useState<Slot[]>(
    Array.from({ length: STRIP_SIZE }, () => ({ ...EMPTY }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings/instagram");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const saved: InstagramSlot[] = Array.isArray(data.items)
          ? data.items
          : [];

        // Always render all four rows, filled from whatever is stored.
        setSlots(
          Array.from({ length: STRIP_SIZE }, (_, i) => ({
            imageUrl: saved[i]?.imageUrl ?? "",
            postUrl: saved[i]?.postUrl ?? "",
          }))
        );
      } catch (err) {
        console.error("Could not load the Instagram strip:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const update = (index: number, patch: Partial<Slot>) =>
    setSlots((current) =>
      current.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
    );

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/settings/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Blank rows mean "unused"; the server ignores them.
        body: JSON.stringify({ items: slots }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save the Instagram strip");
      }

      setMessage(
        data.items.length === 0
          ? "Saved. The strip is empty, so it will not appear on the About page."
          : `Saved ${data.items.length} image${data.items.length === 1 ? "" : "s"}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Four images for the strip on the About page. Each links to its own
        Instagram post. Leave a row blank to skip it; the strip is hidden
        entirely when all four are empty.
      </p>

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

      <div className="space-y-6">
        {slots.map((slot, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-start"
          >
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
              {slot.imageUrl ? (
                <Image
                  src={slot.imageUrl}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  {index + 1}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <ImageUploader
                onUploadComplete={(url) => update(index, { imageUrl: url })}
              />

              <div>
                <label
                  htmlFor={`postUrl-${index}`}
                  className="block text-sm text-gray-700 mb-1"
                >
                  Instagram post URL
                </label>
                <input
                  id={`postUrl-${index}`}
                  type="url"
                  value={slot.postUrl}
                  onChange={(e) => update(index, { postUrl: e.target.value })}
                  placeholder="https://www.instagram.com/p/..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              {slot.imageUrl && (
                <button
                  type="button"
                  onClick={() => update(index, { ...EMPTY })}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear this slot
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 mt-6"
      >
        {isSaving ? "Saving..." : "Update Instagram Strip"}
      </button>
    </div>
  );
}
