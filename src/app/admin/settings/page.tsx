'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function SiteSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
  }

  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [currentHeroImage, setCurrentHeroImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch current hero image
    const fetchHeroImage = async () => {
      try {
        const response = await fetch('/api/settings/hero-image');
        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            setCurrentHeroImage(data.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching hero image:', error);
      }
    };

    fetchHeroImage();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setHeroImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heroImage) {
      setError('Please select an image');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('heroImage', heroImage);

      const response = await fetch('/api/settings/hero-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update hero image');
      }

      const data = await response.json();
      setCurrentHeroImage(data.imageUrl);
      setSuccess('Hero image updated successfully');
      setHeroImage(null);

      // Reset the file input
      const fileInput = document.getElementById('heroImage') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Site Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Homepage Hero Image</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {currentHeroImage && (
          <div className="mb-4">
            <p className="text-gray-700 mb-2">Current Hero Image:</p>
            <div className="relative h-64 w-full">
              <Image
                src={currentHeroImage}
                alt="Current Hero Image"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-md"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="heroImage" className="block text-gray-700 mb-2">
              Upload New Hero Image
            </label>
            <input
              type="file"
              id="heroImage"
              name="heroImage"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-500 mt-1">
              Recommended size: 1920x1080px or larger. This image will be displayed full-screen on the homepage.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !heroImage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading...' : 'Update Hero Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}