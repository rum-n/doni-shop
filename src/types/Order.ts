export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  customer: {
    name: string;
    email: string;
  };
  items: {
    id: string;
    artwork: {
      images: { url: string }[];
      title: string;
      medium: string;
      year: string;
    };
    price: number;
  }[];
}
