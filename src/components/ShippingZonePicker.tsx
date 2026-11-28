"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/components/CartProvider";
import {
  DEFAULT_RATES,
  SHIPPING_ZONES,
  cheapestForZone,
  optionsForZone,
  type ShippingRates,
} from "@/lib/shipping";

/**
 * Where the order ships, chosen before Checkout.
 *
 * Hosted Stripe Checkout shows whichever shipping options the session was built
 * with and cannot narrow them by the address the buyer types, so the zone has
 * to be known first. Checkout then restricts the countries Stripe offers to
 * that zone, which is what stops a domestic rate being paid on a foreign
 * address.
 */
export default function ShippingZonePicker({
  compact = false,
}: {
  /** On the artwork page, where there is no order total to show beside it. */
  compact?: boolean;
}) {
  const t = useTranslations("Shipping");
  const { zone, setZone } = useCart();
  const [rates, setRates] = useState<ShippingRates>(DEFAULT_RATES);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings/shipping");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.rates) setRates(data.rates);
      } catch (error) {
        console.error("Could not load shipping rates:", error);
      }
    };

    load();
  }, []);

  const options = optionsForZone(zone, rates);
  const cheapest = cheapestForZone(zone, rates);

  return (
    <div className={compact ? "" : "mb-6"}>
      <label htmlFor="shipping-zone" className="eyebrow mb-2 block">
        {t("shipTo")}
      </label>

      <select
        id="shipping-zone"
        value={zone}
        onChange={(e) => setZone(e.target.value as typeof zone)}
        className="field cursor-pointer"
      >
        {SHIPPING_ZONES.map((option) => (
          <option key={option} value={option}>
            {t(`zones.${option}`)}
          </option>
        ))}
      </select>

      <p className="meta-text mt-2">
        {options.length > 1
          ? t("fromAmount", { amount: cheapest.toFixed(2) })
          : t("flatAmount", { amount: cheapest.toFixed(2) })}
      </p>

      {options.length > 1 && (
        <p className="meta-text mt-1">{t("chooseAtCheckout")}</p>
      )}
    </div>
  );
}
