'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdminNavbar from '@/components/AdminNavbar';

import { toast } from 'react-hot-toast';
import Image from 'next/image';
import ImageUploader from '@/components/ImageUploader';

interface ArtworkFormData {
  title: string;
  slug: string;
  description: string;
  price: number;
  medium: string;
  year: number;
  dimensions: {
    width: number;
    height: number;
  };
  inStock: boolean;
  featured: boolean;
  images: { url: string; alt?: string }[];
}

export default function EditArtwork({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<ArtworkFormData>({
    title: '',
    slug: '',
    description: '',
    price: 0,
    medium: '',
    year: new Date().getFullYear(),
    dimensions: { width: 0, height: 0 },
    inStock: true,
    featured: false,
    images: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const response = await fetch(`/api/artwork/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch artwork');

        const data = await response.json();
        setFormData({
          ...data.artwork,
          // Ensure proper type conversion for numeric fields
          price: Number(data.artwork.price),
          year: Number(data.artwork.year),
          dimensions: {
            width: Number(data.artwork.dimensions?.width || 0),
            height: Number(data.artwork.dimensions?.height || 0),
          },
        });
      } catch (error) {
        console.error('Error fetching artwork:', error);
        toast.error('Failed to load artwork data');
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
      fetchArtwork();
    }
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');

      // Only handle dimensions since that's our known nested object
      if (parent === 'dimensions' && (child === 'width' || child === 'height')) {
        setFormData({
          ...formData,
          dimensions: {
            ...formData.dimensions,
            [child]: type === 'number' ? Number(value) : value,
          },
        });
      }
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData({
      ...formData,
      images: [...formData.images, { url, alt: formData.title }],
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/artwork/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update artwork');
      }

      toast.success('Artwork updated successfully');
      router.push('/admin/artworks');
    } catch (error) {
      console.error('Error updating artwork:', error);
      toast.error((error as Error).message || 'Failed to update artwork');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isFetching) {
    return (
      <>
        <AdminNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit Artwork</h1>
          <button
            onClick={() => router.push('/admin/artworks')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL-friendly version of the title (e.g., "blue-mountains-painting")
                </p>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (€) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="medium" className="block text-sm font-medium text-gray-700">
                  Medium *
                </label>
                <input
                  type="text"
                  id="medium"
                  name="medium"
                  value={formData.medium}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Oil on canvas"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year *
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dimensions.width" className="block text-sm font-medium text-gray-700">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    id="dimensions.width"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="dimensions.height" className="block text-sm font-medium text-gray-700">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="dimensions.height"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inStock"
                    name="inStock"
                    checked={formData.inStock}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                    Available for purchase
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                    Featured on homepage
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Describe the artwork, technique, inspiration, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden h-40 bg-gray-100">
                      <Image
                        src={image.url}
                        alt={image.alt || formData.title}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        aria-label="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <ImageUploader onUploadComplete={handleImageUpload} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Update Artwork'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}