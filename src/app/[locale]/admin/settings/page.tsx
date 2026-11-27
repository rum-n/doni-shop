'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AdminNavbar from '@/components/AdminNavbar';
import ImageUploader from '@/components/ImageUploader';
import InstagramStripEditor from '@/components/InstagramStripEditor';
import LocalizedMarkdownEditor from '@/components/LocalizedMarkdownEditor';
import { EMPTY_LOCALIZED, type LocalizedText } from '@/lib/localized-setting';

export default function SiteSettings() {
  const [currentHeroImage, setCurrentHeroImage] = useState<string | null>(null);
  const [aboutMeContent, setAboutMeContent] =
    useState<LocalizedText>(EMPTY_LOCALIZED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [homepageContent, setHomepageContent] =
    useState<LocalizedText>(EMPTY_LOCALIZED);

  useEffect(() => {
    // Fetch current hero image
    const fetchHeroImage = async () => {
      try {
        const response = await fetch('/api/settings/hero-image');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setCurrentHeroImage(data.imageUrl ?? null);
        // Per-locale, and empty on a fresh install.
        setHomepageContent(data.homepageContent ?? EMPTY_LOCALIZED);
      } catch (error) {
        console.error('Error fetching hero image:', error);
      }
    };

    // Fetch current about me content
    const fetchAboutMeContent = async () => {
      try {
        const response = await fetch('/api/settings/about-me');
        const data = await response.json();
        setAboutMeContent(data.content ?? EMPTY_LOCALIZED);
        setEditorLoaded(true);
      } catch (error) {
        console.error('Error fetching about me content:', error);
        setEditorLoaded(true);
      }
    };

    fetchHeroImage();
    fetchAboutMeContent();
  }, []);

  // The image is already in Cloudinary by the time this runs: the uploader
  // sends the file straight there, so only the URL comes back here.
  const handleHeroImageUploaded = async (url: string) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/settings/hero-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!response.ok) {
        throw new Error('Failed to update hero image');
      }

      const data = await response.json();
      setCurrentHeroImage(data.imageUrl);
      setSuccessMessage('Hero image updated successfully');
    } catch (error) {
      setError('An error occurred while updating the hero image');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAboutMeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/settings/about-me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: aboutMeContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to update about me content');
      }

      setSuccessMessage('About me content updated successfully');
    } catch (error) {
      setError('An error occurred while updating the about me content');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHomepageContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/settings/homepage-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: homepageContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to update homepage content');
      }

      setSuccessMessage('Homepage content updated successfully');
    } catch (error) {
      setError('An error occurred while updating the homepage content');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Site Settings</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Homepage Content</h2>

          <form onSubmit={handleHomepageContentSubmit}>
            <div className="mb-4">
              {editorLoaded ? (
                <LocalizedMarkdownEditor
                  id="homepage"
                  value={homepageContent}
                  onChange={setHomepageContent}
                />
              ) : (
                <div className="flex justify-center items-center h-[400px] bg-gray-50 border border-gray-300 rounded-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 mt-4"
            >
              {isSubmitting ? 'Saving...' : 'Update Homepage Content'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Hero Image</h2>

          {currentHeroImage && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current Hero Image:</p>
              <div className="relative w-full max-w-md aspect-video rounded-md overflow-hidden">
                <Image
                  src={currentHeroImage}
                  alt="Current hero image"
                  fill
                  sizes="(max-width: 768px) 100vw, 448px"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="mb-2">
            <p className="block text-gray-700 mb-2">Upload New Hero Image</p>
            <ImageUploader onUploadComplete={handleHeroImageUploaded} />
            {isSubmitting && (
              <p className="text-sm text-gray-500 mt-2">Saving...</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Instagram Strip</h2>
          <InstagramStripEditor />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">About Me Content</h2>

          <form onSubmit={handleAboutMeSubmit}>
            <div className="mb-4">
              {editorLoaded ? (
                <LocalizedMarkdownEditor
                  id="about"
                  value={aboutMeContent}
                  onChange={setAboutMeContent}
                />
              ) : (
                <div className="flex justify-center items-center h-[400px] bg-gray-50 border border-gray-300 rounded-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 mt-4"
            >
              {isSubmitting ? 'Saving...' : 'Update About Me Content'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}