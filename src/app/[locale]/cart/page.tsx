"use client";

import MainLayout from "@/components/MainLayout";

export default function CartPage() {
  return (
    <MainLayout currentPath="/cart">
      <div className="p-4 lg:p-12">
        <h1 className="text-3xl lg:text-5xl font-playfair-regular text-slate-800 mb-8 lg:mb-12 text-center tracking-wide">
          Shopping Cart
        </h1>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 lg:p-12 border border-slate-200 max-w-2xl mx-auto">
          <p className="text-slate-600 text-center py-12 lg:py-16 font-light text-lg leading-relaxed">
            Your cart is empty. Start shopping to add items to your cart.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
