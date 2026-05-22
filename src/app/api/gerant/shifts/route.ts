import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Shift, Sale } from '@/lib/models';

async function handler(request: NextRequest, user: any) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    await connectDB();

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1);

    const shifts = await Shift.find({
      gerant: user.sub,
      startTime: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })
      .populate('station', 'name')
      .sort({ startTime: -1 });

    const shiftSales: { [key: string]: any[] } = {};
    const shiftsWithSummary = await Promise.all(
      shifts.map(async (shift) => {
        const sales = await Sale.find({ shift: shift._id });
        const totalSales = sales.reduce((sum, sale) => sum + sale.amountMAD, 0);
        const totalLiters = sales.reduce((sum, sale) => sum + sale.liters, 0);

        shiftSales[shift._id.toString()] = sales;

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
        shifts: shiftsWithSummary,
        shiftSales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get shifts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function GET(request: NextRequest) {
  return withAuth(request, handler, ['gerant']);
}
