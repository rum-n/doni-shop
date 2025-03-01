'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function About() {
  return (
    <>
      <Navbar currentPath="/about" />

      <main className="container mx-auto px-4 py-8">
        <section className="about-header py-8">
          <h1 className="text-4xl font-bold mb-4 text-center">About the Artist</h1>
        </section>

        <section className="about-content max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1">
              <div className="relative h-80 md:h-full rounded-lg overflow-hidden shadow-md">
                <Image
                  src=""
                  alt="Violetta Boyadzhieva"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg"
                  // Fallback for missing image
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/400x600?text=Artist+Portrait";
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">Violetta Boyadzhieva</h2>
              <p className="text-gray-700 mb-4">
                Born in Sofia, Bulgaria, Violetta Boyadzhieva is a contemporary artist whose work explores the intersection of traditional techniques and modern themes. With over 15 years of experience, her paintings have been exhibited in galleries across Europe and North America.
              </p>
              <p className="text-gray-700 mb-4">
                Violetta's artistic journey began at the National Academy of Arts in Sofia, where she developed a strong foundation in classical painting techniques. She later expanded her horizons by studying contemporary art practices at Central Saint Martins in London.
              </p>
              <p className="text-gray-700">
                Her work is characterized by bold color choices, textural complexity, and a unique blend of abstract and figurative elements that invite viewers to discover their own interpretations.
              </p>
            </div>
          </div>

          <div className="artist-statement mb-12">
            <h2 className="text-2xl font-semibold mb-4">Artist Statement</h2>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-700 mb-4 italic">
                "My work is an ongoing exploration of memory, identity, and the spaces between reality and imagination. I am fascinated by how color and texture can evoke emotional responses that transcend cultural and linguistic boundaries.
              </p>
              <p className="text-gray-700 mb-4 italic">
                Each painting begins as a conversation between myself and the canvas—a dialogue that evolves as layers of paint accumulate and interact. I often incorporate mixed media elements to create depth and complexity, inviting viewers to look closer and discover new details with each viewing.
              </p>
              <p className="text-gray-700 italic">
                Through my art, I hope to create moments of contemplation and connection in our increasingly fast-paced world, offering spaces where beauty and meaning can be discovered through patient observation."
              </p>
            </div>
          </div>

          <div className="education-experience mb-12">
            <h2 className="text-2xl font-semibold mb-4">Education & Experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-medium mb-3">Education</h3>
                <ul className="space-y-4">
                  <li>
                    <div className="font-medium">MFA in Fine Arts</div>
                    <div className="text-gray-600">Central Saint Martins, London</div>
                    <div className="text-gray-500">2010-2012</div>
                  </li>
                  <li>
                    <div className="font-medium">BFA in Painting</div>
                    <div className="text-gray-600">National Academy of Arts, Sofia</div>
                    <div className="text-gray-500">2005-2009</div>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-3">Selected Exhibitions</h3>
                <ul className="space-y-4">
                  <li>
                    <div className="font-medium">"Chromatic Dialogues" (Solo Exhibition)</div>
                    <div className="text-gray-600">Gallery Modern, New York</div>
                    <div className="text-gray-500">2022</div>
                  </li>
                  <li>
                    <div className="font-medium">"Emerging Perspectives" (Group Exhibition)</div>
                    <div className="text-gray-600">Contemporary Art Space, Berlin</div>
                    <div className="text-gray-500">2020</div>
                  </li>
                  <li>
                    <div className="font-medium">"Textural Landscapes" (Solo Exhibition)</div>
                    <div className="text-gray-600">Sofia City Gallery, Bulgaria</div>
                    <div className="text-gray-500">2018</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="contact-info mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact & Commissions</h2>
            <p className="text-gray-700 mb-6">
              Violetta welcomes inquiries about her artwork, exhibition opportunities, and commission requests. For more information, please use the contact details below.
            </p>
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="font-medium text-lg mb-2">Contact Information</h3>
                <p className="text-gray-600">Email: info@violettaboyadzhieva.com</p>
                <p className="text-gray-600">Phone: +1 (555) 123-4567</p>
              </div>
              <div>
                <h3 className="font-medium text-lg mb-2">Studio Location</h3>
                <p className="text-gray-600">123 Artist Lane</p>
                <p className="text-gray-600">Brooklyn, NY 11211</p>
                <p className="text-gray-600">United States</p>
              </div>
            </div>
          </div>

          <div className="cta-section text-center py-8">
            <h2 className="text-2xl font-semibold mb-6">Explore Violetta's Work</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/gallery"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
              >
                View Gallery
              </Link>
              <Link
                href="/shop"
                className="bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-900 transition"
              >
                Shop Artworks
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}