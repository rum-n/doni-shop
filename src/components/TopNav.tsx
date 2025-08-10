"use client";

import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface TopNavProps {
  currentPath: string;
}

export default function TopNav({ currentPath }: TopNavProps) {
  const t = useTranslations("Navigation");

  // Log current path for debugging (can be removed in production)
  console.log("Current path:", currentPath);

  return (
    <div className="fixed top-0 right-0 left-0 h-20 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-30">
      <div className="flex justify-between items-center h-full px-4 lg:px-8">
        {/* Artist Name - Left Side */}
        <div className="flex items-center">
          <Link
            href="/"
            className="text-lg lg:text-2xl uppercase font-playfair-regular text-slate-800 tracking-wider hover:text-slate-600 transition-colors duration-300"
          >
            Doni Boyadzhieva
          </Link>
        </div>

        {/* Right Side - Language Switcher and Cart */}
        <div className="flex items-center space-x-3 lg:space-x-6">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Cart */}
          <Link
            href="/cart"
            className="flex items-center space-x-2 mr-20 lg:mr-0 lg:space-x-3 px-3 lg:px-6 py-2 lg:py-3 rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all duration-300 border border-slate-200"
          >
            <span className="text-sm lg:text-base font-light tracking-wide sm:inline">
              {t("cart")}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
