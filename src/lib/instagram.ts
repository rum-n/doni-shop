/**
 * Shared shape for the Instagram strip on the About page.
 *
 * A route module may only export handlers and a fixed set of config fields, so
 * these live here rather than beside the handler.
 */

/** How many slots the strip has. The storefront renders exactly these. */
export const STRIP_SIZE = 4;

export const INSTAGRAM_PROFILE = "https://www.instagram.com/nordkinsart";

// Images are uploaded to Cloudinary by the browser. Instagram's own CDN URLs
// are signed and expire, and hotlinking them is blocked, so the picture has to
// live in Cloudinary even though the link points back to Instagram.
export const CLOUDINARY_URL_PREFIX = "https://res.cloudinary.com/";
export const INSTAGRAM_URL = /^https:\/\/(?:www\.)?instagram\.com\/[^\s]*$/i;

export interface InstagramSlot {
  imageUrl: string;
  postUrl: string;
}
