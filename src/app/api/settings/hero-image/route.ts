import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadImage } from '@/lib/uploadImage';

// GET endpoint to retrieve the current hero image
export async function GET() {
  try {
    const heroSetting = await db.siteSettings.findUnique({
      where: { key: 'heroImage' },
    });

    if (heroSetting) {
      return NextResponse.json({ imageUrl: heroSetting.value?.toString() || null });
    } else {
      return NextResponse.json({ imageUrl: null });
    }
  } catch (error) {
    console.error('Error fetching hero image:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching the hero image' },
      { status: 500 }
    );
  }
}

// POST endpoint to update the hero image
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const heroImage = formData.get('heroImage');

    if (!heroImage || !(heroImage instanceof Blob)) {
      return NextResponse.json({ message: 'No image provided' }, { status: 400 });
    }

    // Upload the image
    const imageUrl = await uploadImage(heroImage);

    // Update or create the hero image setting in the database
    const heroSetting = await db.siteSettings.upsert({
      where: { key: 'heroImage' },
      update: {
        value: { url: imageUrl },
        updatedAt: new Date(),
      },
      create: {
        key: 'heroImage',
        value: { url: imageUrl },
      },
    });

    return NextResponse.json({
      message: 'Hero image updated successfully',
      imageUrl: heroSetting.value?.toString() || null
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating hero image:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating the hero image' },
      { status: 500 }
    );
  }
}