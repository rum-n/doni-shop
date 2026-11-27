'use client';

import { useId, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

// Sends the file straight to Cloudinary. Uses XHR rather than fetch because
// only XHR reports upload progress.
function uploadToCloudinary(
  file: File,
  auth: UploadSignature,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', auth.apiKey);
    body.append('timestamp', String(auth.timestamp));
    body.append('folder', auth.folder);
    body.append('signature', auth.signature);

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${auth.cloudName}/image/upload`
    );

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      let payload: { secure_url?: string; error?: { message?: string } };

      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('Cloudinary returned an unreadable response'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload.secure_url) {
        resolve(payload.secure_url);
      } else {
        reject(new Error(payload.error?.message || 'Cloudinary rejected the upload'));
      }
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Network error while uploading to Cloudinary'))
    );
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.send(body);
  });
}

export default function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // A page can hold several uploaders — the settings page has one for the hero
  // image and one per Instagram slot. A hard-coded id made every label point at
  // the first input in the document, so clicking any uploader opened (and then
  // replaced) the hero image. useId gives each instance its own.
  const inputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Ask our server to authorize this upload, then send the bytes directly
      // to Cloudinary so they never travel through the deployment.
      const signatureResponse = await fetch('/api/upload/signature', {
        method: 'POST',
      });

      if (!signatureResponse.ok) {
        throw new Error('Could not authorize the upload');
      }

      const auth: UploadSignature = await signatureResponse.json();
      const url = await uploadToCloudinary(file, auth, setProgress);

      onUploadComplete(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    } finally {
      setIsUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
      {isUploading ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Uploading… {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <>
          <label
            htmlFor={inputId}
            className="cursor-pointer block p-4 text-gray-500"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-1 text-sm">Click to upload an image</p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
}
