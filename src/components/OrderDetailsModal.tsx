"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ORDER_STATUSES, type OrderStatus } from "@/types/Order";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
};

interface ShippingAddress {
  name?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  state?: string | null;
  country?: string | null;
}

interface OrderDetailsModalProps {
  orderId: string | null;
  onClose: () => void;
  /** Lets the orders table reflect a status change without a full reload. */
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
}

interface OrderItem {
  id: string;
  price: number;
  quantity: number;
  artwork: {
    id: string;
    title: string;
    medium: string;
    year: number;
    images: { url: string }[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  shippingCost?: number | null;
  shippingMethod?: string | null;
  status: OrderStatus;
  createdAt: string;
  shippingAddress: ShippingAddress | null;
  customer: {
    name: string | null;
    email: string;
  };
  items: OrderItem[];
}

export default function OrderDetailsModal({
  orderId,
  onClose,
  onStatusChange,
}: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) throw new Error("Failed to fetch order");
        const data = await response.json();
        setOrder(data.order);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!orderId || !order || status === order.status) return;

    setSavingStatus(true);
    const previous = order.status;
    // Show the new value straight away, and put it back if the save fails.
    setOrder({ ...order, status });

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      onStatusChange?.(orderId, status);
      toast.success(`Order marked as ${status}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      setOrder({ ...order, status: previous });
      toast.error("Could not update the order status");
    } finally {
      setSavingStatus(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold mb-0">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : order ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Order Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Order Number:</span>{" "}
                      {order.orderNumber}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {typeof order.shippingCost === "number" && (
                      <>
                        <p>
                          <span className="font-medium">Items:</span>{" "}
                          {(order.total - order.shippingCost).toFixed(2)} EUR
                        </p>
                        <p>
                          <span className="font-medium">Shipping:</span>{" "}
                          {order.shippingCost.toFixed(2)} EUR
                        </p>
                      </>
                    )}
                    <p>
                      <span className="font-medium">Total Amount:</span>{" "}
                      {order.total.toFixed(2)} EUR
                    </p>
                    {order.shippingMethod && (
                      <p>
                        <span className="font-medium">Delivery:</span>{" "}
                        {order.shippingMethod}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <label
                        htmlFor="order-status"
                        className="font-medium"
                      >
                        Status:
                      </label>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_STYLES[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                      <select
                        id="order-status"
                        value={order.status}
                        disabled={savingStatus}
                        onChange={(e) =>
                          handleStatusChange(e.target.value as OrderStatus)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {order.customer.name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {order.customer.email}
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold mt-5 mb-3">
                    Shipping Address
                  </h3>
                  {order.shippingAddress ? (
                    <address className="text-sm not-italic leading-relaxed text-gray-700">
                      {order.shippingAddress.name && (
                        <>
                          {order.shippingAddress.name}
                          <br />
                        </>
                      )}
                      {order.shippingAddress.line1}
                      <br />
                      {order.shippingAddress.line2 && (
                        <>
                          {order.shippingAddress.line2}
                          <br />
                        </>
                      )}
                      {[
                        order.shippingAddress.postalCode,
                        order.shippingAddress.city,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      <br />
                      {[
                        order.shippingAddress.state,
                        order.shippingAddress.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {order.shippingAddress.phone && (
                        <>
                          <br />
                          {order.shippingAddress.phone}
                        </>
                      )}
                    </address>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No address on this order. Orders placed before address
                      collection was added will not have one.
                    </p>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Artwork
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Details
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.artwork.images && item.artwork.images[0] && (
                              <div className="flex-shrink-0 h-16 w-16 relative">
                                <Image
                                  src={
                                    typeof item.artwork.images[0] ===
                                      "object" &&
                                    "url" in item.artwork.images[0]
                                      ? (
                                          item.artwork.images[0] as {
                                            url: string;
                                          }
                                        ).url
                                      : ""
                                  }
                                  alt={item.artwork.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.artwork.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.artwork.medium}, {item.artwork.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.price.toFixed(2)} EUR
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Order not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
