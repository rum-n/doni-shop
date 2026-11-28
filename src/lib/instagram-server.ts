import { db } from "@/lib/db";
import { CLOUDINARY_URL_PREFIX, INSTAGRAM_URL, STRIP_SIZE, type InstagramSlot } from "@/lib/instagram";

/** The curated strip, read on the server and re-validated on the way out. */
export async function getInstagramSlots(): Promise<InstagramSlot[]> {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: "instagramStrip" },
    });

    const items =
      setting?.value && typeof setting.value === "object" && "items" in setting.value
        ? (setting.value as { items?: unknown }).items
        : null;

    if (!Array.isArray(items)) return [];

    return items
      .filter((item): item is InstagramSlot => {
        if (!item || typeof item !== "object") return false;
        const slot = item as Partial<InstagramSlot>;
        return (
          typeof slot.imageUrl === "string" &&
          slot.imageUrl.startsWith(CLOUDINARY_URL_PREFIX) &&
          typeof slot.postUrl === "string" &&
          INSTAGRAM_URL.test(slot.postUrl)
        );
      })
      .slice(0, STRIP_SIZE);
  } catch (error) {
    console.error("Could not read the Instagram strip:", error);
    return [];
  }
}
