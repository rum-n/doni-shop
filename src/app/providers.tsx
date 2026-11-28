'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/components/CartProvider";
import { Suspense } from "react";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster position="bottom-center" />
        {/* Suspense because the tracker reads searchParams, which opts its
            subtree into client rendering. */}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </CartProvider>
    </SessionProvider>
  );
}
