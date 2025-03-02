import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest, res: NextResponse
) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { message: 'Artwork slug is required' },
        { status: 400 }
      );
    }

    const artwork = await db.artwork.findUnique({
      where: { slug },
    });

    if (!artwork) {
      return NextResponse.json(
        { message: 'Artwork not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching the artwork' },
      { status: 500 }
    );
  }
}