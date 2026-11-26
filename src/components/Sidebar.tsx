"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  HIDE_DESKTOP_SIDEBAR_PATHS,
  MOBILE_ITEMS,
  SIDEBAR_ITEMS,
} from "@/lib/navigation";

interface SidebarProps {
  currentPath: string;
  onMenuStateChange?: (isOpen: boolean) => void;
}

export default function Sidebar({
  currentPath,
  onMenuStateChange,
}: SidebarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations("Navigation");

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    onMenuStateChange?.(newState);
  };

  const isActive = (path: string) => {
    return currentPath === path;
  };

  const isHomepage = currentPath === "/";
  const isIndividualArtwork = currentPath.includes("/artwork/");
  const hideDesktopSidebar = HIDE_DESKTOP_SIDEBAR_PATHS.includes(currentPath);

  if (isIndividualArtwork) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-6 z-50">
        <button
          onClick={toggleMenu}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface/90 text-ink shadow-card backdrop-blur-sm transition-all duration-300 hover:bg-surface hover:shadow-card-hover"
        >
          <svg
            className={`w-6 h-6 transition-transform duration-300 ${
              isMenuOpen ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 transform border-r border-line bg-surface/95 backdrop-blur-sm transition-transform duration-300 lg:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-8">
          {/* Artist Name */}
          <div className="mb-12">
            <Link
              href="/"
              className="font-display text-2xl font-normal uppercase tracking-wider text-ink transition-colors duration-300 hover:text-ink-muted"
              onClick={toggleMenu}
            >
              Doni Boyadzhieva
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col space-y-4">
            {MOBILE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={toggleMenu}
                className={`rounded-media px-6 py-4 font-light tracking-wide transition-all duration-300 ${
                  isActive(item.href)
                    ? "border border-line bg-surface-sunken text-ink"
                    : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                <span className="text-lg">{t(item.label)}</span>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto text-center">
            <p className="text-xs font-light text-ink-faint">
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      {!hideDesktopSidebar && (
        <div className="hidden lg:block fixed left-15 top-1/2 transform -translate-y-1/2 z-40">
          <div className="flex flex-col space-y-6">
            {/* Navigation Links */}
            {SIDEBAR_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative font-display tracking-wide transition-all duration-300 hover:underline hover:underline-offset-[6px] ${
                  isHomepage
                    ? isActive(item.href)
                      ? "font-medium text-white underline underline-offset-[6px]"
                      : "font-normal text-white"
                    : isActive(item.href)
                      ? "font-medium text-ink underline underline-offset-[6px]"
                      : "font-normal text-ink-soft hover:text-ink"
                }`}
              >
                <span className="text-lg group-hover:scale-105 transition-transform duration-300">
                  {t(item.label)}
                </span>
              </Link>
            ))}

            {/* Footer */}
            <div className="mt-8"></div>
          </div>
        </div>
      )}
    </>
  );
}
