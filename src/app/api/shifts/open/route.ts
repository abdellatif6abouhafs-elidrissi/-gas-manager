import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Shift } from '@/lib/models';

async function handler(request: NextRequest, user: any) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { stationId, openingCash } = await request.json();

    if (!stationId || openingCash === undefined) {
      return NextResponse.json(
        { error: 'stationId and openingCash are required' },
        { status: 400 }
      );
    }

    if (openingCash < 0) {
      return NextResponse.json(
        { error: 'Opening cash cannot be negative' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingOpenShift = await Shift.findOne({
      station: stationId,
      status: 'open',
    });

    if (existingOpenShift) {
      existingOpenShift.closingCash = 0;
      existingOpenShift.endTime = new Date();
      existingOpenShift.status = 'closed';
      existingOpenShift.notes = 'auto-closed';
      await existingOpenShift.save();
    }

    const shift = await Shift.create({
      station: stationId,
      gerant: user.sub,
      startTime: new Date(),
      openingCash,
      status: 'open',
    });

    return NextResponse.json(
      {
        message: 'Shift opened successfully',
        shift: shift.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Open shift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function POST(request: NextRequest) {
  return withAuth(request, handler, ['gerant']);
}
