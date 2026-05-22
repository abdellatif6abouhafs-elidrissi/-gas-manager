import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Shift, Product } from '@/lib/models';

async function handler(request: NextRequest, user: any) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shiftId, productType, quantity, amountMAD } = body;

    if (!shiftId || !productType || quantity === undefined || !amountMAD) {
      return NextResponse.json(
        { error: 'Missing required fields: shiftId, productType, quantity, amountMAD' },
        { status: 400 }
      );
    }

    const validProductTypes = ['oil', 'air', 'car_wash', 'accessories', 'other'];
    if (!validProductTypes.includes(productType)) {
      return NextResponse.json(
        { error: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    if (shift.gerant.toString() !== user.sub) {
      return NextResponse.json(
        { error: 'You can only record sales for your own shifts' },
        { status: 403 }
      );
    }

    const product = await Product.create({
      shift: shiftId,
      productType,
      quantity,
      amountMAD,
    });

    return NextResponse.json(
      {
        message: 'Product sale recorded successfully',
        product: product.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Record product sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function POST(request: NextRequest) {
  return withAuth(request, handler, ['gerant']);
}
