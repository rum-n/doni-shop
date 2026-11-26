/**
 * Countries Stripe will collect a shipping address for at checkout.
 *
 * Set to the EU, which matches the shop's EUR pricing and its EN/BG audience.
 * Trim or extend this one list to change where the shop ships; nothing else
 * needs to move.
 */
export const SHIPPING_COUNTRIES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
  "NL", "PL", "PT", "RO", "SE", "SI", "SK",
] as const;
