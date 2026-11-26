"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { startCheckout, CheckoutError } from "@/lib/checkout";

export default function BuyButton({
  artworkId,
  inStock,
}: {
  artworkId: string;
  inStock: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("BuyButton");
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      await startCheckout([artworkId], locale);
      // On success the browser is already navigating to Stripe.
    } catch (error) {
      console.error("Error initiating checkout:", error);
      toast.error(
        error instanceof CheckoutError
          ? error.message
          : "Unable to start checkout. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={!inStock || isLoading}
      className={`btn btn-block ${inStock ? "btn-primary" : "btn-secondary"}`}
    >
      {isLoading ? t("processing") : inStock ? t("text") : t("outOfStock")}
    </button>
  );
}
