/**
 * Shipping zones and rates.
 *
 * Hosted Stripe Checkout shows whatever `shipping_options` the session was
 * created with, regardless of the address the buyer then types — there is no
 * per-country filter. So the zone is chosen on this site *before* the session
 * exists, and each session is created with `allowed_countries` narrowed to that
 * zone. A buyer who picked Bulgaria is then only offered Bulgaria in Stripe's
 * country dropdown, so a domestic rate can never be paid on a foreign address.
 *
 * Within a zone there is no such risk, which is why Bulgaria can safely offer
 * two options and let the buyer pick between them inside Checkout.
 */

export const SHIPPING_ZONES = ["bg", "eu"] as const;
export type ShippingZone = (typeof SHIPPING_ZONES)[number];

export const DEFAULT_ZONE: ShippingZone = "bg";

/** EU member states, minus Bulgaria, which is its own zone. */
const EU_COUNTRIES = [
  "AT", "BE", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
  "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL",
  "PL", "PT", "RO", "SE", "SI", "SK",
] as const;

export const ZONE_COUNTRIES: Record<ShippingZone, string[]> = {
  bg: ["BG"],
  eu: [...EU_COUNTRIES],
};

/** Every country the shop will ship to, for reference and copy. */
export const SHIPPING_COUNTRIES = [...ZONE_COUNTRIES.bg, ...ZONE_COUNTRIES.eu];

/**
 * Rates in EUR, editable in Admin → Site Settings.
 *
 * PLACEHOLDERS — set the real amounts in the admin before taking orders.
 */
export interface ShippingRates {
  /** Bulgaria, delivered to an Econt/Speedy office. */
  bgOffice: number;
  /** Bulgaria, delivered to the buyer's address. */
  bgAddress: number;
  /** Anywhere else in the EU. */
  eu: number;
}

export const DEFAULT_RATES: ShippingRates = {
  bgOffice: 3,
  bgAddress: 5,
  eu: 15,
};

export function isShippingZone(value: unknown): value is ShippingZone {
  return (
    typeof value === "string" &&
    (SHIPPING_ZONES as readonly string[]).includes(value)
  );
}

/** Reads stored rates, falling back per-field so a partial row still works. */
export function readShippingRates(value: unknown): ShippingRates {
  if (!value || typeof value !== "object") return { ...DEFAULT_RATES };

  const raw = value as Record<string, unknown>;
  const pick = (key: keyof ShippingRates): number => {
    const n = Number(raw[key]);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_RATES[key];
  };

  return {
    bgOffice: pick("bgOffice"),
    bgAddress: pick("bgAddress"),
    eu: pick("eu"),
  };
}

/** Validates an admin submission. Returns null when it is not usable. */
export function parseShippingRates(value: unknown): ShippingRates | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const out = {} as ShippingRates;

  for (const key of ["bgOffice", "bgAddress", "eu"] as const) {
    const n = Number(raw[key]);
    // Zero is a legitimate rate: it means free shipping for that option.
    if (!Number.isFinite(n) || n < 0 || n > 1000) return null;
    out[key] = Math.round(n * 100) / 100;
  }

  return out;
}

export interface ShippingOption {
  /** Shown to the buyer in Checkout and stored on the order. */
  label: string;
  amount: number;
}

/**
 * The options Checkout should offer for a zone.
 *
 * Bulgaria returns two so the buyer picks; the EU returns one.
 */
export function optionsForZone(
  zone: ShippingZone,
  rates: ShippingRates
): ShippingOption[] {
  if (zone === "bg") {
    return [
      { label: "Courier office (Econt / Speedy)", amount: rates.bgOffice },
      { label: "Delivery to my address", amount: rates.bgAddress },
    ];
  }

  return [{ label: "Standard delivery within the EU", amount: rates.eu }];
}

/** The lowest price for a zone, for the "from €x" line on the cart. */
export function cheapestForZone(
  zone: ShippingZone,
  rates: ShippingRates
): number {
  return Math.min(...optionsForZone(zone, rates).map((o) => o.amount));
}
