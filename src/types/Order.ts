/** Mirrors the comment on Order.status in the Prisma schema. */
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface ShippingAddress {
  name?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  /** Postage, already included in `total`. */
  shippingCost?: number | null;
  /** Which delivery option the buyer chose — says where the parcel goes. */
  shippingMethod?: string | null;
  status: OrderStatus;
  shippingAddress?: ShippingAddress | null;
  customer: {
    name: string | null;
    email: string;
  };
  items: {
    id: string;
    artwork: {
      images: { url: string }[];
      title: string;
      medium: string;
      year: number;
    };
    price: number;
  }[];
}
