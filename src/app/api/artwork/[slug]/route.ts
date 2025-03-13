import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const idFromPath = pathParts[pathParts.length - 1];

  const artworkId = (await params).id || idFromPath;

  if (!artworkId) {
    return NextResponse.json({ message: 'Artwork ID is required' }, { status: 400 });
  }

  try {
    const artwork = await db.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      return NextResponse.json({ message: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return NextResponse.json(
      { message: 'Error fetching artwork', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.price || !body.medium || !body.year) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if artwork exists
    const existingArtwork = await db.artwork.findUnique({
      where: { id: (await params).id },
    });

    if (!existingArtwork) {
      return NextResponse.json({ message: 'Artwork not found' }, { status: 404 });
    }

    // Check if slug is unique (excluding the current artwork)
    if (body.slug !== existingArtwork.slug) {
      const slugExists = await db.artwork.findFirst({
        where: {
          slug: body.slug,
          id: { not: (await params).id },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { message: 'Slug must be unique' },
          { status: 400 }
        );
      }
    }

    // Update artwork
    const updatedArtwork = await db.artwork.update({
      where: { id: (await params).id },
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        price: body.price,
        medium: body.medium,
        year: body.year,
        dimensions: body.dimensions,
        inStock: body.inStock,
        featured: body.featured,
        images: body.images,
      },
    });

    return NextResponse.json({ artwork: updatedArtwork });
  } catch (error) {
    console.error('Error updating artwork:', error);
    return NextResponse.json(
      { message: 'Error updating artwork' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if artwork exists
    const existingArtwork = await db.artwork.findUnique({
      where: { id: (await params).id },
    });

    if (!existingArtwork) {
      return NextResponse.json({ message: 'Artwork not found' }, { status: 404 });
    }

    // Check if artwork has orders - prevent deletion if it does
    const ordersWithArtwork = await db.order.findMany({
      where: {
        items: {
          some: {
            artworkId: (await params).id,
          },
        },
      },
    });

    if (ordersWithArtwork.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete artwork with associated orders' },
        { status: 400 }
      );
    }

    // Delete artwork
    await db.artwork.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    return NextResponse.json(
      { message: 'Error deleting artwork' },
      { status: 500 }
    );
  }
}