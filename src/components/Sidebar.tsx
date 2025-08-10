"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const t = useTranslations("Navigation");

  const isActive = (path: string) => {
    return currentPath === path;
  };

  const navItems = [
    {
      href: "/prints",
      label: "prints",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      href: "/linocut-stamps",
      label: "linocutStamps",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
          />
        </svg>
      ),
    },
    {
      href: "/accessories",
      label: "accessories",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-40">
      <div className="flex flex-col space-y-4">
        {/* Navigation Buttons */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
              isActive(item.href)
                ? "bg-white/90 backdrop-blur-sm text-slate-800 shadow-lg border border-slate-200"
                : "bg-white/70 backdrop-blur-sm text-slate-600 hover:bg-white/90 hover:text-slate-800 hover:shadow-lg border border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </span>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
              <span className="text-sm font-light text-slate-800 tracking-wide">
                {t(item.label)}
              </span>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white/95 rotate-45 border-l border-b border-slate-200"></div>
            </div>
          </Link>
        ))}

        {/* Footer */}
        <div className="mt-8 text-center"></div>
      </div>
    </div>
  );
}
