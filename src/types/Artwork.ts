export interface Artwork {
  id: string;
  title: string;
  slug: string;
  price: number;
  medium: string;
  year: number;
  images?: { url: string; alt: string }[];
  description: string;
  dimensions: {
    width: string;
    height: string;
    unit: string;
  };
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
}