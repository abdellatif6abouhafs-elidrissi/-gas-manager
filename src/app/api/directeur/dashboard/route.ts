import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Shift, Sale, Station } from '@/lib/models';

async function handler(request: NextRequest, user: any) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    await connectDB();

    const today = new Date().toISOString().split('T')[0];
    const dateObj = new Date(today);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1);

    // Get all stations owned by this directeur
    const stations = await Station.find({ owner: user.sub });
    const stationIds = stations.map(s => s._id);

    if (stationIds.length === 0) {
      return NextResponse.json(
        {
          stations: [],
          todaysShifts: [],
          salesByFuelType: { gasoil: 0, essence: 0, gpl: 0 },
          gerantPerformance: [],
          totalRevenue: 0,
          totalLiters: 0,
          totalShifts: 0,
        },
        { status: 200 }
      );
    }

    // Get today's shifts for all stations
    const shifts = await Shift.find({
      station: { $in: stationIds },
      startTime: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })
      .populate('gerant', 'firstName lastName email')
      .populate('station', 'name address')
      .sort({ startTime: -1 });

    // Get all sales for today's shifts
    const shiftIds = shifts.map(s => s._id);
    const sales = await Sale.find({
      shift: { $in: shiftIds },
    });

    // Calculate metrics
    let totalRevenue = 0;
    let totalLiters = 0;
    const salesByFuelType = { gasoil: 0, essence: 0, gpl: 0 };
    const gerantStats: { [key: string]: { name: string; totalSales: number; totalLiters: number; salesCount: number } } = {};

    sales.forEach(sale => {
      totalRevenue += sale.amountMAD;
      totalLiters += sale.liters;
      salesByFuelType[sale.fuelType as keyof typeof salesByFuelType] += sale.amountMAD;

      const gerantId = shifts.find(s => s._id.toString() === sale.shift.toString())?.gerant._id.toString();
      if (gerantId) {
        if (!gerantStats[gerantId]) {
          const gerant = shifts.find(s => s._id.toString() === sale.shift.toString())?.gerant;
          gerantStats[gerantId] = {
            name: `${gerant?.firstName} ${gerant?.lastName}`,
            totalSales: 0,
            totalLiters: 0,
            salesCount: 0,
          };
        }
        gerantStats[gerantId].totalSales += sale.amountMAD;
        gerantStats[gerantId].totalLiters += sale.liters;
        gerantStats[gerantId].salesCount += 1;
      }
    });

    const gerantPerformance = Object.values(gerantStats).sort(
      (a, b) => b.totalSales - a.totalSales
    );

    return NextResponse.json(
      {
        stations: stations.map(s => s.toObject()),
        todaysShifts: shifts.map(s => ({
          ...s.toObject(),
          salesCount: sales.filter(sale => sale.shift.toString() === s._id.toString()).length,
          totalSales: sales
            .filter(sale => sale.shift.toString() === s._id.toString())
            .reduce((sum, sale) => sum + sale.amountMAD, 0),
        })),
        salesByFuelType,
        gerantPerformance,
        totalRevenue,
        totalLiters,
        totalShifts: shifts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get directeur dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function GET(request: NextRequest) {
  return withAuth(request, handler, ['directeur']);
}
