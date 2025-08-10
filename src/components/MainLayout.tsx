"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import SocialMediaIcons from "./SocialMediaIcons";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function MainLayout({ children, currentPath }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuStateChange = (isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-gray-50">
      {/* Floating Navigation Buttons */}
      <Sidebar
        currentPath={currentPath}
        onMenuStateChange={handleMenuStateChange}
      />

      {/* Social Media Icons - Hidden on mobile when menu is open */}
      <SocialMediaIcons hideOnMobile={isMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <TopNav currentPath={currentPath} />

        {/* Main Content */}
        <main className="flex-1 pt-20 lg:pt-20 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
