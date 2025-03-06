'use client';
import { useState } from 'react';
// import { loadStripe } from '@stripe/stripe-js';

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const BuyButton = ({ artworkId, inStock }: { artworkId: string, inStock: boolean }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      alert('Unable to process purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={!inStock || isLoading}
      className={`text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition cursor-pointer w-50 ${!inStock
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium`}
    >
      {isLoading ? 'В процес на обработка...' : inStock ? 'Купи' : 'Продадено'}
    </button>
  );
};