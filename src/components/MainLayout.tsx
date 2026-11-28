"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import SocialMediaIcons from "./SocialMediaIcons";
import SiteFooter from "./SiteFooter";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function MainLayout({ children, currentPath }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // `min-h-screen` with normal document scrolling, rather than a fixed-height
    // shell with an inner `overflow-auto` pane: the nested scroller broke
    // scroll restoration and fought the mobile address bar.
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav currentPath={currentPath} />

      <Sidebar
        currentPath={currentPath}
        onMenuStateChange={setIsMobileMenuOpen}
      />

      <SocialMediaIcons hideOnMobile={isMobileMenuOpen} />

      {/* pt-20 clears the fixed header */}
      <main className="flex-1 pt-20">{children}</main>

      <SiteFooter />
    </div>
  );
}
