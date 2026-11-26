import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/require-admin";
import { db } from '@/lib/db';
import { ORDER_STATUSES } from '@/types/Order';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { orderId } = await params;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            artwork: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { message: 'Error fetching order' },
      { status: 500 }
    );
  }
}

/** Moves an order through fulfilment: pending → processing → completed. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { orderId } = await params;
    const body = await request.json();
    const status = body?.status;

    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          message: `Status must be one of: ${ORDER_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const existing = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { message: 'Error updating order' },
      { status: 500 }
    );
  }
}
