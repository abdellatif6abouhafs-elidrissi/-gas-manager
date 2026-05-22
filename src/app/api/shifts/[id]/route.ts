import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Shift, Sale, Station } from '@/lib/models';

async function handler(
  request: NextRequest,
  user: any,
  params: { id: string }
) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const shiftId = params.id;

    await connectDB();

    const shift = await Shift.findById(shiftId)
      .populate('station', 'name address')
      .populate('gerant', 'firstName lastName email');

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    const station = await Station.findById(shift.station);

    if (user.role === 'gerant' && shift.gerant.toString() !== user.sub) {
      return NextResponse.json(
        { error: 'You can only view your own shifts' },
        { status: 403 }
      );
    }

    if (user.role === 'directeur' && station?.owner.toString() !== user.sub) {
      return NextResponse.json(
        { error: 'You can only view shifts for your stations' },
        { status: 403 }
      );
    }

    const sales = await Sale.find({ shift: shiftId });

    const totalSales = sales.reduce((sum, sale) => sum + sale.amountMAD, 0);
    const totalLiters = sales.reduce((sum, sale) => sum + sale.liters, 0);

    return NextResponse.json(
      {
        shift: shift.toObject(),
        sales,
        summary: {
          totalSales,
          totalLiters,
          openingCash: shift.openingCash,
          closingCash: shift.closingCash,
          difference: shift.closingCash
            ? shift.closingCash - shift.openingCash - totalSales
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get shift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    (req, user, p) => handler(req, user, p || params),
    ['gerant', 'directeur'],
    params
  );
}
