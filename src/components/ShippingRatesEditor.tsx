"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RATES, type ShippingRates } from "@/lib/shipping";

const FIELDS: {
  key: keyof ShippingRates;
  label: string;
  hint: string;
}[] = [
  {
    key: "bgOffice",
    label: "Bulgaria — to a courier office",
    hint: "Econt or Speedy office pickup, usually the cheaper option.",
  },
  {
    key: "bgAddress",
    label: "Bulgaria — to the buyer's address",
    hint: "Door delivery.",
  },
  {
    key: "eu",
    label: "Rest of the EU",
    hint: "One flat rate for every other EU country.",
  },
];

/**
 * Postage, in EUR, charged once per order on top of the items.
 *
 * Bulgarian buyers choose between the two domestic options inside Stripe
 * Checkout; EU buyers get the single rate. Zero means free for that option.
 */
export default function ShippingRatesEditor() {
  const [rates, setRates] = useState<ShippingRates>(DEFAULT_RATES);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings/shipping");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.rates) setRates(data.rates);
        setUsingDefaults(Boolean(data.usingDefaults));
      } catch (err) {
        console.error("Could not load shipping rates:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/settings/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save");

      setRates(data.rates);
      setUsingDefaults(false);
      setMessage("Shipping rates updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Charged once per order, on top of the items. Bulgarian buyers pick
        between the two domestic options during checkout. Enter 0 to make an
        option free.
      </p>

      {usingDefaults && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded mb-4 text-sm">
          These are placeholder amounts and have never been saved. Set your real
          postage before taking orders.
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

      <div className="space-y-4">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            <label
              htmlFor={`rate-${key}`}
              className="block text-sm font-medium text-gray-700"
            >
              {label}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id={`rate-${key}`}
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={rates[key]}
                onChange={(e) =>
                  setRates({ ...rates, [key]: Number(e.target.value) })
                }
                className="w-32 rounded-md border border-gray-300 px-3 py-2"
              />
              <span className="text-sm text-gray-500">EUR</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 mt-6"
      >
        {isSaving ? "Saving..." : "Update Shipping Rates"}
      </button>
    </div>
  );
}
