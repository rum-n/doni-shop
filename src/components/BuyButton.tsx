"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useTranslations } from "next-intl";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function BuyButton({
  artworkId,
  inStock,
}: {
  artworkId: string;
  inStock: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("BuyButton");

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      // 1. Create checkout session on server
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId }),
      });

      const { sessionId } = await response.json();

      // 2. Use Stripe to redirect to checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Failed to load Stripe");

      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Stripe redirect error:", error);
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      alert("Unable to process purchase. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={!inStock || isLoading}
      className={`w-full py-4 px-8 rounded-full cursor-pointer transition-all duration-300 font-light tracking-wide ${
        !inStock
          ? "bg-slate-200 cursor-not-allowed text-slate-400"
          : "bg-slate-700 hover:bg-slate-800 text-white shadow-sm hover:shadow-md"
      }`}
    >
      {isLoading ? t("processing") : inStock ? t("text") : t("soldOut")}
    </button>
  );
}
