import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Shift, Station, Sale } from '@/lib/models';

async function handler(
  request: NextRequest,
  user: any,
  params: { stationId: string }
) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { stationId } = params;
    const { status, startDate, endDate } = Object.fromEntries(
      request.nextUrl.searchParams
    );

    await connectDB();

    const station = await Station.findById(stationId);

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    if (user.role === 'directeur' && station.owner.toString() !== user.sub) {
      return NextResponse.json(
        { error: 'You can only view your own stations' },
        { status: 403 }
      );
    }

    const query: any = { station: stationId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate as string);
      }
    }

    const shifts = await Shift.find(query)
      .populate('gerant', 'firstName lastName email')
      .sort({ startTime: -1 });

    const shiftsWithSummary = await Promise.all(
      shifts.map(async (shift) => {
        const sales = await Sale.find({ shift: shift._id });
        const totalSales = sales.reduce((sum, sale) => sum + sale.amountMAD, 0);
        const totalLiters = sales.reduce((sum, sale) => sum + sale.liters, 0);

        return {
          ...shift.toObject(),
          summary: {
            totalSales,
            totalLiters,
            salesCount: sales.length,
          },
        };
      })
    );

    return NextResponse.json(
      {
        station: station.toObject(),
        shifts: shiftsWithSummary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get station shifts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  const resolvedParams = await params;
  return withAuth(
    request,
    (req, user, p) => handler(req, user, p || resolvedParams),
    ['directeur'],
    resolvedParams
  );
}
