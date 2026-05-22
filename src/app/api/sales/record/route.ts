import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Sale, Shift, FuelType } from '@/lib/models';

async function handler(request: NextRequest, user: any) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { shiftId, pumpNumber, fuelType, liters, amountMAD } =
      await request.json();

    if (
      !shiftId ||
      !pumpNumber ||
      !fuelType ||
      liters === undefined ||
      amountMAD === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'shiftId, pumpNumber, fuelType, liters, and amountMAD are required',
        },
        { status: 400 }
      );
    }

    const validFuelTypes: FuelType[] = ['gasoil', 'essence', 'gpl'];
    if (!validFuelTypes.includes(fuelType)) {
      return NextResponse.json(
        { error: 'Invalid fuel type. Must be gasoil, essence, or gpl' },
        { status: 400 }
      );
    }

    if (pumpNumber < 1) {
      return NextResponse.json(
        { error: 'Pump number must be at least 1' },
        { status: 400 }
      );
    }

    if (liters <= 0 || amountMAD <= 0) {
      return NextResponse.json(
        { error: 'Liters and amount must be positive' },
        { status: 400 }
      );
    }

    await connectDB();

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    if (shift.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot record sales for a closed shift' },
        { status: 400 }
      );
    }

    if (shift.gerant.toString() !== user.sub) {
      return NextResponse.json(
        { error: 'You can only record sales for your own shifts' },
        { status: 403 }
      );
    }

    const sale = await Sale.create({
      shift: shiftId,
      pumpNumber,
      fuelType,
      liters,
      amountMAD,
    });

    return NextResponse.json(
      {
        message: 'Sale recorded successfully',
        sale: sale.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Record sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function POST(request: NextRequest) {
  return withAuth(request, handler, ['gerant']);
}
