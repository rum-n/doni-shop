"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/MainLayout";
import { useCart, type CartItem } from "@/components/CartProvider";
import { startCheckout, CheckoutError } from "@/lib/checkout";
import type { Artwork } from "@/types/Artwork";

export default function CartPage() {
  const t = useTranslations("Cart");
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const { items, ready, total, remove, replace } = useCart();
  const [checking, setChecking] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  /**
   * A cart can sit in localStorage for weeks. Before showing it, re-check every
   * piece against the database: anything unavailable is dropped, and prices are
   * refreshed so the total always matches what Stripe will charge.
   */
  const revalidate = useCallback(async () => {
    if (items.length === 0) {
      setChecking(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/artwork?ids=${items.map((item) => item.id).join(",")}`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: { artworks: Artwork[] } = await response.json();
      const live = new Map(data.artworks.map((a) => [a.id, a]));

      const kept: CartItem[] = [];
      const dropped: string[] = [];

      for (const item of items) {
        const artwork = live.get(item.id);

        if (!artwork || !artwork.inStock) {
          dropped.push(item.title);
          continue;
        }

        kept.push({
          id: artwork.id,
          slug: artwork.slug,
          title: artwork.title,
          price: artwork.price,
          image: artwork.images?.[0]?.url ?? null,
        });
      }

      if (dropped.length > 0) {
        replace(kept);
        toast.error(t("unavailableRemoved", { titles: dropped.join(", ") }));
      } else if (
        kept.some(
          (item, i) => item.price !== items[i]?.price || item.id !== items[i]?.id
        )
      ) {
        // Prices moved but nothing went unavailable: update quietly.
        replace(kept);
      }
    } catch (error) {
      console.error("Could not re-check the cart:", error);
      // Keep showing the stored cart; checkout re-checks server-side anyway.
    } finally {
      setChecking(false);
    }
    // Deliberately runs once per mount: it rewrites `items`, so depending on
    // it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (ready) revalidate();
  }, [ready, revalidate]);

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      await startCheckout(
        items.map((item) => item.id),
        locale
      );
    } catch (error) {
      console.error("Checkout failed:", error);

      if (error instanceof CheckoutError && error.unavailable?.length) {
        const goneIds = new Set(error.unavailable.map((a) => a.id));
        replace(items.filter((item) => !goneIds.has(item.id)));
        toast.error(
          t("unavailableRemoved", {
            titles: error.unavailable.map((a) => a.title).join(", "),
          })
        );
      } else {
        toast.error(
          error instanceof CheckoutError ? error.message : t("checkoutFailed")
        );
      }

      setIsCheckingOut(false);
    }
  };

  const isBusy = !ready || checking;

  return (
    <MainLayout currentPath="/cart">
      <div className="page-shell page-width-narrow">
        <header className="page-header">
          <h1 className="page-title">{t("title")}</h1>
        </header>

        <div className="mx-auto max-w-2xl">
          {isBusy ? (
            <div className="flex justify-center py-16">
              <div className="spinner h-10 w-10" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center lg:py-16">
              <p className="mb-8 text-lg font-light leading-relaxed text-ink-soft">
                {t("empty")}
              </p>
              <Link href="/prints" className="btn btn-primary">
                {t("browse")}
              </Link>
            </div>
          ) : (
            <>
              <ul className="mb-8 divide-y divide-line border-y border-line">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-5">
                    <div className="media-frame h-20 w-20 flex-shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/artwork/${item.slug}`}
                        className="block truncate font-light text-ink transition-colors hover:text-ink-muted"
                      >
                        {item.title}
                      </Link>
                      <p className="meta-text mt-1">
                        {item.price.toFixed(2)} EUR
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        remove(item.id);
                        toast.success(t("removed", { title: item.title }));
                      }}
                      className="cursor-pointer p-2 text-ink-faint transition-colors hover:text-ink"
                      aria-label={t("removeFromCart")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mb-8 flex items-baseline justify-between">
                <span className="text-lg font-light text-ink-soft">
                  {t("total")}
                </span>
                <span className="font-display text-2xl font-normal text-ink">
                  {total.toFixed(2)} EUR
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="btn btn-primary btn-block"
              >
                {isCheckingOut ? t("processing") : t("checkout")}
              </button>

              <p className="meta-text mt-4 text-center">
                {t("shippingNote")}
              </p>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
