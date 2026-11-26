"use client";

import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { useCart, type CartItem } from "@/components/CartProvider";

export default function AddToCartButton({
  item,
  inStock,
}: {
  item: CartItem;
  inStock: boolean;
}) {
  const t = useTranslations("Cart");
  const { add, remove, has, ready } = useCart();

  const inCart = has(item.id);

  if (!inStock) return null;

  return (
    <button
      onClick={() => {
        if (inCart) {
          remove(item.id);
          toast.success(t("removed", { title: item.title }));
        } else {
          add(item);
          toast.success(t("added", { title: item.title }));
        }
      }}
      disabled={!ready}
      className="btn btn-secondary btn-block"
    >
      {inCart ? t("removeFromCart") : t("addToCart")}
    </button>
  );
}
