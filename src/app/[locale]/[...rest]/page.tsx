import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched paths inside a locale.
 *
 * Without it, `/en/anything` falls through to Next's built-in 404, which sits
 * outside the locale layout: no translations, and none of the site's styling.
 * Calling notFound() here renders `[locale]/not-found.tsx` instead.
 */
export default function CatchAllNotFound() {
  notFound();
}
