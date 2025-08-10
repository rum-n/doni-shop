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
  category: string;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
}

export interface ArtworkFormData {
  title: string;
  slug: string;
  description: { [key: string]: string };
  price: number;
  medium: string;
  year: number;
  width: number;
  height: number;
  unit: string;
  category: string;
  inStock: boolean;
  featured: boolean;
  images: { url: string; alt: string }[];
}
