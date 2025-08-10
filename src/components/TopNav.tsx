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
      <div className="flex justify-between items-center h-full px-8">
        {/* Artist Name - Left Side */}
        <div className="flex items-center">
          <Link
            href="/"
            className="text-2xl uppercase font-light text-slate-800 tracking-wider hover:text-slate-600 transition-colors duration-300"
          >
            Doni Boyadzhieva
          </Link>
        </div>

        {/* Right Side - Language Switcher and Cart */}
        <div className="flex items-center space-x-6">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Cart */}
          <Link
            href="/cart"
            className="flex items-center space-x-3 px-6 py-3 rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all duration-300 border border-slate-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
              />
            </svg>
            <span className="font-light tracking-wide">{t("cart")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
