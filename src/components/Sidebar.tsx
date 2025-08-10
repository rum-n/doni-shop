"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

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

  const navItems = [
    { href: "/prints", label: "prints" },
    { href: "/linocut-stamps", label: "linocutStamps" },
    { href: "/accessories", label: "accessories" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-6 z-50">
        <button
          onClick={toggleMenu}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-800 hover:bg-white transition-all duration-300"
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
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={toggleMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm border-r border-slate-200 z-50 transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-8">
          {/* Artist Name */}
          <div className="mb-12">
            <Link
              href="/"
              className="text-2xl uppercase font-playfair-regular text-slate-800 tracking-wider hover:text-slate-600 transition-colors duration-300"
              onClick={toggleMenu}
            >
              Doni Boyadzhieva
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={toggleMenu}
                className={`px-6 py-4 rounded-xl transition-all duration-300 font-light tracking-wide ${
                  isActive(item.href)
                    ? "bg-slate-100 text-slate-800 border border-slate-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="text-lg">{t(item.label)}</span>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto text-center">
            <p className="text-xs text-slate-500 font-light">© 2024</p>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-15 top-1/2 transform -translate-y-1/2 z-40">
        <div className="flex flex-col space-y-6">
          {/* Navigation Links */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative font-playfair-regular tracking-wide transition-all duration-300 hover:underline hover:underline-offset-6 ${
                isActive(item.href)
                  ? "text-slate-800 font-medium underline underline-offset-6"
                  : "text-slate-600 hover:text-slate-800"
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
    </>
  );
}
