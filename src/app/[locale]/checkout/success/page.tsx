"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MainLayout from "@/components/MainLayout";
import { useCart } from "@/components/CartProvider";

interface ConfirmedOrder {
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  shippingAddress: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  items: {
    id: string;
    price: number;
    quantity: number;
    artwork: { title: string; slug: string };
  }[];
}

// The order is written by the Stripe webhook, which can land a moment after the
// buyer is redirected here. Poll briefly rather than claim it does not exist.
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 8;

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const t = useTranslations("CheckoutSuccess");
  const { clear } = useCart();

  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [state, setState] = useState<"loading" | "pending" | "ready" | "error">(
    sessionId ? "loading" : "error"
  );

  // The purchase went through, so whatever was in the cart has been bought.
  useEffect(() => {
    clear();
  }, [clear]);

  const load = useCallback(async () => {
    if (!sessionId) return;

    let attempts = 0;

    const attempt = async (): Promise<void> => {
      attempts += 1;

      try {
        const response = await fetch(`/api/orders/session/${sessionId}`);

        if (response.status === 202) {
          if (attempts >= MAX_ATTEMPTS) {
            setState("pending");
            return;
          }
          setState("loading");
          setTimeout(attempt, POLL_INTERVAL_MS);
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        setOrder(data.order);
        setState("ready");
      } catch (error) {
        console.error("Error fetching order details:", error);
        setState(attempts >= MAX_ATTEMPTS ? "error" : "pending");
      }
    };

    await attempt();
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page-shell page-width-narrow">
      <header className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-intro">{t("subtitle")}</p>
      </header>

      {state === "loading" && (
        <div className="flex justify-center py-10">
          <div className="spinner h-10 w-10" />
        </div>
      )}

      {/* The payment succeeded either way — never imply it did not. */}
      {(state === "pending" || state === "error") && (
        <div className="notice text-center">{t("stillProcessing")}</div>
      )}

      {state === "ready" && order && (
        <div className="card panel-pad">
          <dl className="mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="font-light text-ink-muted">{t("orderNumber")}</dt>
              <dd className="pl-4 text-right font-mono text-xs break-all text-ink">
                {order.orderNumber}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-light text-ink-muted">{t("date")}</dt>
              <dd className="text-ink">
                {new Date(order.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          <ul className="mb-6 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <Link
                  href={`/artwork/${item.artwork.slug}`}
                  className="font-light text-ink-soft transition-colors hover:text-ink"
                >
                  {item.artwork.title}
                </Link>
                <span className="font-light whitespace-nowrap text-ink-muted">
                  {item.price.toFixed(2)} EUR
                </span>
              </li>
            ))}
          </ul>

          <div className="mb-8 flex justify-between text-lg">
            <span className="font-light text-ink-soft">{t("total")}</span>
            <span className="font-display text-ink">
              {order.total.toFixed(2)} EUR
            </span>
          </div>

          {order.shippingAddress && (
            <div className="mb-2">
              <h2 className="eyebrow mb-2">{t("shippingTo")}</h2>
              <address className="text-sm font-light leading-relaxed text-ink-soft not-italic">
                {order.shippingAddress.name && (
                  <>
                    {order.shippingAddress.name}
                    <br />
                  </>
                )}
                {order.shippingAddress.line1}
                <br />
                {order.shippingAddress.line2 && (
                  <>
                    {order.shippingAddress.line2}
                    <br />
                  </>
                )}
                {[
                  order.shippingAddress.postalCode,
                  order.shippingAddress.city,
                  order.shippingAddress.country,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </address>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/prints" className="btn btn-primary">
          {t("continue")}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <MainLayout currentPath="/checkout/success">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <div className="spinner h-10 w-10" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </MainLayout>
  );
}
