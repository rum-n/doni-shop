"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { useCart } from "./CartProvider";
import { HEADER_ITEMS } from "@/lib/navigation";

interface TopNavProps {
  currentPath: string;
}

export default function TopNav({ currentPath }: TopNavProps) {
  const t = useTranslations("Navigation");
  const { count, ready } = useCart();

  const isCart = currentPath === "/cart";

  return (
    <div className="fixed top-0 right-0 left-0 z-30 h-20 border-b border-line bg-surface/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-12">
        {/* Artist Name - Left Side */}
        <div className="flex items-center">
          <Link
            href="/"
            className="font-display text-lg font-normal uppercase tracking-wider text-ink transition-colors duration-300 hover:text-ink-muted lg:text-2xl"
          >
            Doni Boyadzhieva
          </Link>
        </div>

        {/* Right Side - primary links, language switcher and cart */}
        <div className="flex items-center gap-3 lg:gap-6">
          {/* Hidden below `lg`, where the header has no room beside the name,
              the cart and the menu button — the mobile drawer in Sidebar
              carries these instead. */}
          <nav className="hidden items-center gap-8 lg:flex">
            {HEADER_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={currentPath === item.href ? "page" : undefined}
                className={`font-display text-lg tracking-wide transition-all duration-300 hover:underline hover:underline-offset-[6px] ${
                  currentPath === item.href
                    ? "font-medium text-ink underline underline-offset-[6px]"
                    : "font-normal text-ink-soft hover:text-ink"
                }`}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>

          <LanguageSwitcher />

          <Link
            href="/cart"
            aria-current={isCart ? "page" : undefined}
            className={`mr-20 flex items-center gap-2 rounded-full border px-3 py-2 transition-all duration-300 lg:mr-0 lg:gap-3 lg:px-6 lg:py-3 ${
              isCart
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-surface-sunken text-ink-soft hover:border-line-strong hover:bg-surface"
            }`}
          >
            <span className="text-sm font-light tracking-wide lg:text-base">
              {t("cart")}
            </span>
            {/* Rendered only once the stored cart has been read, so the count
                never flashes a stale zero. */}
            {ready && count > 0 && (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                  isCart ? "bg-surface text-ink" : "bg-accent text-on-accent"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
