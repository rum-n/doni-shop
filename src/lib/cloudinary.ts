import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configure(): boolean {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    return false;
  }

  if (!configured) {
    cloudinary.config({ cloud_name, api_key, api_secret });
    configured = true;
  }

  return true;
}

/**
 * Recovers an asset's public id from its delivery URL.
 *
 * A Cloudinary URL looks like
 *   https://res.cloudinary.com/<cloud>/image/upload/v1234/folder/name.jpg
 * and the public id is everything after the version, without the extension —
 * here, `folder/name`. Transformation segments can also sit between `upload`
 * and the version, so take everything after the version instead of assuming a
 * fixed position.
 */
export function publicIdFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) return null;

    let rest = parts.slice(uploadIndex + 1);

    // A version marker ends any transformation segments, so when one is present
    // the public id is simply everything after it.
    const versionIndex = rest.findIndex((part) => /^v\d+$/.test(part));

    if (versionIndex !== -1) {
      rest = rest.slice(versionIndex + 1);
    } else {
      // No version: drop leading transformation segments, which are either
      // comma-separated parameter lists (w_500,c_fill) or a single parameter.
      while (rest.length > 1 && /^[a-z]{1,3}_[^/]*$/.test(rest[0])) {
        rest = rest.slice(1);
      }
    }

    if (rest.length === 0) return null;

    const joined = rest.join("/");
    return joined.replace(/\.[^./]+$/, "") || null;
  } catch {
    return null;
  }
}

/**
 * Deletes images from Cloudinary, best effort.
 *
 * Never throws: the database row is the source of truth, and a stranded image
 * costs a little storage, while a failed delete that surfaces as an error
 * would leave the caller unsure whether the record went.
 */
export async function deleteImages(urls: string[]): Promise<void> {
  if (urls.length === 0 || !configure()) return;

  const publicIds = urls
    .map(publicIdFromUrl)
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error(`Could not delete Cloudinary asset ${publicId}:`, error);
      }
    })
  );
}
