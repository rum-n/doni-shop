'use client';

import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { useEffect, useState } from 'react';

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Artist Name / Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-800 uppercase">
                Violetta Boyadzhieva
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <Link href="/about" className="text-gray-600 hover:text-gray-900">
                  About
                </Link>
                <Link href="/gallery" className="text-gray-600 hover:text-gray-900">
                  Gallery
                </Link>
                <Link href="/shop" className="text-gray-600 hover:text-gray-900">
                  Shop
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                <svg
                  className={`h-6 w-6 ${isMenuOpen ? 'hidden' : 'block'}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`h-6 w-6 ${isMenuOpen ? 'block' : 'hidden'}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/gallery"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Gallery
            </Link>
            <Link
              href="/shop"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>
          </div>
        </div>
      </nav>

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