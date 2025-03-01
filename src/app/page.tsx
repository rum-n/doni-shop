'use client';

import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

interface Artwork {
  id: string;
  title: string;
  slug: string;
  price: number;
  medium: string;
  year: number;
}

export default function Home() {
  const [featuredArtworks, setFeaturedArtworks] = useState<Artwork[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchFeaturedArtworks = async () => {
      try {
        const artworks = await db.artwork.findMany({
          where: {
            featured: true,
            inStock: true,
          },
          take: 3,
        });
        setFeaturedArtworks(artworks);
      } catch (error) {
        console.error('Error fetching artworks:', error);
        // Set mock data if database fetch fails
        setFeaturedArtworks([
          {
            id: '1',
            title: 'Sunset Over Mountains',
            slug: 'sunset-over-mountains',
            price: 1200,
            medium: 'Oil on canvas',
            year: 2023,
          },
          {
            id: '2',
            title: 'Abstract Emotions',
            slug: 'abstract-emotions',
            price: 950,
            medium: 'Acrylic on canvas',
            year: 2022,
          },
          {
            id: '3',
            title: 'Urban Landscape',
            slug: 'urban-landscape',
            price: 1500,
            medium: 'Mixed media',
            year: 2023,
          }
        ]);
      }
    };
    fetchFeaturedArtworks();
  }, []);

  return (
    <>
      <Navbar currentPath="/" />
      <main className="container mx-auto px-4 py-8">
        <section className="hero py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Artist Portfolio</h1>
            <p className="text-xl mb-8">Discover unique artworks from a passionate creator</p>
            <Link
              href="/gallery"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
            >
              View Gallery
            </Link>
          </div>
        </section>

        <section className="featured-works py-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredArtworks && featuredArtworks.length > 0 && featuredArtworks.map((artwork: any) => (
              <div key={artwork.id} className="artwork-card border rounded-lg overflow-hidden">
                <div className="relative h-64">
                  {artwork.images && artwork.images[0] && (
                    <Image
                      src={artwork.images[0].url}
                      alt={artwork.images[0].alt || 'Artwork'}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{artwork.title}</h3>
                  <p className="text-gray-600">{artwork.medium}, {artwork.year}</p>
                  <p className="text-lg font-bold mt-2">${artwork.price}</p>
                  <Link
                    href={`/artwork/${artwork.slug}`}
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/gallery"
              className="text-blue-600 hover:underline"
            >
              View All Artworks
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}