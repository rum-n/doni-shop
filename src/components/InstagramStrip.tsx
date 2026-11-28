import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { INSTAGRAM_PROFILE } from "@/lib/instagram";
import { getInstagramSlots } from "@/lib/instagram-server";

/**
 * A row of images from Instagram, each linking to its own post.
 *
 * The pictures are uploaded to Cloudinary and curated in the admin rather than
 * pulled from Instagram: their CDN URLs are signed, expire, and cannot be
 * hotlinked, so a stored Instagram image address would break within days.
 *
 * A server component — renders nothing at all when no slots are filled, so the
 * About page never shows an empty heading over a blank row.
 */
export default async function InstagramStrip({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const items = await getInstagramSlots();

  if (items.length === 0) return null;

  return (
    <section className="mt-14 border-t border-line pt-10 lg:mt-20">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="section-title">{t("instagramTitle")}</h2>
        <a
          href={INSTAGRAM_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-light text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
        >
          {t("instagramCta")}
        </a>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {items.map((item) => (
          <li key={item.postUrl}>
            <a
              href={item.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="media-frame group block aspect-square border border-line transition-all duration-300 hover:border-line-strong hover:shadow-card-hover"
            >
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
