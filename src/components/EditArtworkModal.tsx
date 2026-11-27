'use client';

import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import ImageUploader from '@/components/ImageUploader';
import { MAX_ARTWORK_IMAGES } from '@/lib/artwork';
import Image from 'next/image';

const CATEGORIES = [
  { value: 'prints', label: 'Prints' },
  { value: 'linocut-stamps', label: 'Linocut Stamps' },
  { value: 'accessories', label: 'Accessories' },
];

interface ArtworkFormData {
  id: string;
  title: string;
  slug: string;
  /** Bilingual, matching what the API stores and the public pages read. */
  description: { en: string; bg: string };
  price: number;
  medium: string;
  category: string;
  year: number;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  inStock: boolean;
  featured: boolean;
  images: { url: string; alt?: string }[];
}

interface EditArtworkModalProps {
  artworkId: string | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EditArtworkModal({ artworkId, onClose, onSave }: EditArtworkModalProps) {

  const [formData, setFormData] = useState<ArtworkFormData>({
    id: '',
    title: '',
    slug: '',
    description: { en: '', bg: '' },
    price: 0,
    medium: '',
    category: 'prints',
    year: new Date().getFullYear(),
    dimensions: { width: 0, height: 0, unit: 'cm' },
    inStock: true,
    featured: false,
    images: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!artworkId) {
      console.warn('No artwork ID provided to modal');
      return;
    }

    const fetchArtwork = async () => {
      setIsFetching(true);
      try {
        const url = `/api/artwork/${encodeURIComponent(artworkId)}`;

        const response = await fetch(url);


        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response text:', errorText);

          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to fetch artwork');
          } catch {
            throw new Error(`Failed to fetch artwork: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();

        const raw = data.artwork;

        // Rows written before the shop was bilingual hold a plain string.
        const description =
          typeof raw.description === 'string'
            ? { en: raw.description, bg: raw.description }
            : {
                en: raw.description?.en ?? '',
                bg: raw.description?.bg ?? '',
              };

        setFormData({
          ...raw,
          description,
          // Ensure proper type conversion for numeric fields
          price: Number(raw.price),
          year: Number(raw.year),
          category: raw.category || 'prints',
          dimensions: {
            width: Number(raw.dimensions?.width || 0),
            height: Number(raw.dimensions?.height || 0),
            // Carried through, so saving an edit cannot silently drop it.
            unit: raw.dimensions?.unit || 'cm',
          },
        });
      } catch (error) {
        console.error('Error fetching artwork:', error);
        toast.error('Failed to load artwork data');
        onClose();
      } finally {
        setIsFetching(false);
      }
    };

    fetchArtwork();
  }, [artworkId, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      // Handle nested properties (dimensions, and the two descriptions)
      const [parent, child] = name.split('.');

      if (parent === 'dimensions') {
        setFormData({
          ...formData,
          dimensions: {
            ...formData.dimensions,
            [child]: type === 'number' ? Number(value) : value,
          },
        });
      } else if (parent === 'description' && (child === 'en' || child === 'bg')) {
        setFormData({
          ...formData,
          description: { ...formData.description, [child]: value },
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
    if (formData.images.length >= MAX_ARTWORK_IMAGES) {
      toast.error(
        `Maximum of ${MAX_ARTWORK_IMAGES} images allowed per artwork`
      );
      return;
    }

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

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...formData.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/artwork/${artworkId}`, {
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
      onSave();
    } catch (error) {
      console.error('Error updating artwork:', error);
      toast.error((error as Error).message || 'Failed to update artwork');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto flex justify-center items-start pt-4 pb-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold mb-0">Edit Artwork</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isFetching ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      URL-friendly version of the title
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
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="dimensions.width" className="block text-sm font-medium text-gray-700">
                        Width
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
                        Height
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

                    <div>
                      <label htmlFor="dimensions.unit" className="block text-sm font-medium text-gray-700">
                        Unit
                      </label>
                      <input
                        type="text"
                        id="dimensions.unit"
                        name="dimensions.unit"
                        value={formData.dimensions.unit}
                        onChange={handleChange}
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
                        In stock
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
                    <label htmlFor="description.en" className="block text-sm font-medium text-gray-700">
                      Description (English)
                    </label>
                    <textarea
                      id="description.en"
                      name="description.en"
                      value={formData.description.en}
                      onChange={handleChange}
                      rows={5}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="description.bg" className="block text-sm font-medium text-gray-700">
                      Description (Bulgarian)
                    </label>
                    <textarea
                      id="description.bg"
                      name="description.bg"
                      value={formData.description.bg}
                      onChange={handleChange}
                      rows={5}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images ({formData.images.length}/{MAX_ARTWORK_IMAGES})
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden h-40 bg-gray-100">
                          <Image
                            src={image.url}
                            alt={image.alt || formData.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 flex justify-between text-white">
                            <div className="flex space-x-2">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => reorderImages(index, index - 1)}
                                  className="text-white hover:text-blue-300"
                                  aria-label="Move left"
                                >
                                  ←
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="text-white hover:text-red-300"
                                aria-label="Remove image"
                              >
                                ×
                              </button>

                              {index < formData.images.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => reorderImages(index, index + 1)}
                                  className="text-white hover:text-blue-300"
                                  aria-label="Move right"
                                >
                                  →
                                </button>
                              )}
                            </div>
                            {index === 0 && <span className="text-xs">Main</span>}
                          </div>
                        </div>
                      ))}

                      {formData.images.length < MAX_ARTWORK_IMAGES && (
                        <div className="h-40">
                          <ImageUploader onUploadComplete={handleImageUpload} />
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">
                      Add up to {MAX_ARTWORK_IMAGES} images. The first image
                      will be shown in gallery listings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}