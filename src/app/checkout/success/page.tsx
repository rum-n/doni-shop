'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) return;

      try {
        const response = await fetch(`/api/orders/session/${sessionId}`);
        const data = await response.json();
        setOrderDetails(data.order);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Благодаря за вашата поръчка!</h1>
      <p className="text-xl mb-8">Вашата поръчка е успешно обработена.</p>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        orderDetails && (
          <div className="mb-8">
            <p>Детайлите на вашата поръчка са изпратени на вашият имейл.</p>
          </div>
        )
      )}

      <div className="mt-8">
        <Link
          href="/gallery"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md"
        >
          Разгледайте още творби
        </Link>
      </div>
    </div>
  );
}