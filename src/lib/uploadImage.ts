// src/lib/uploadImage.ts
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImage(file: Blob): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename with proper extension
    let filename;

    if ('name' in file && typeof file.name === 'string') {
      // Extract the file extension from the original filename
      const fileExt = path.extname(file.name);
      filename = `${uuidv4()}${fileExt}`;
    } else {
      // Fallback to a generic extension if name is not available
      filename = `${uuidv4()}.jpg`;
    }

    const filepath = path.join(process.cwd(), 'public/uploads', filename);

    // Ensure the directory exists
    await writeFile(filepath, buffer);

    // Return the URL that can be used to access the file
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}