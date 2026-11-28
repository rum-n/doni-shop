import { db } from "@/lib/db";
import { DEFAULT_RATES, readShippingRates, type ShippingRates } from "@/lib/shipping";

/**
 * Current rates, straight from the database.
 *
 * Checkout reads these itself rather than trusting an amount from the browser —
 * otherwise a crafted request could set its own postage to zero.
 */
export async function getShippingRates(): Promise<ShippingRates> {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: "shippingRates" },
    });

    return setting ? readShippingRates(setting.value) : DEFAULT_RATES;
  } catch (error) {
    console.error("Could not read shipping rates, using defaults:", error);
    return DEFAULT_RATES;
  }
}
