import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import { Shift } from '@/lib/models';

async function handler(request: NextRequest, user: any) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { shiftId, closingCash } = await request.json();

    if (!shiftId || closingCash === undefined) {
      return NextResponse.json(
        { error: 'shiftId and closingCash are required' },
        { status: 400 }
      );
    }

    if (closingCash < 0) {
      return NextResponse.json(
        { error: 'Closing cash cannot be negative' },
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
        { error: 'Shift is already closed' },
        { status: 400 }
      );
    }

    if (shift.gerant.toString() !== user.sub) {
      return NextResponse.json(
        { error: 'You can only close your own shifts' },
        { status: 403 }
      );
    }

    shift.closingCash = closingCash;
    shift.endTime = new Date();
    shift.status = 'closed';

    await shift.save();

    return NextResponse.json(
      {
        message: 'Shift closed successfully',
        shift: shift.toObject(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Close shift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function POST(request: NextRequest) {
  return withAuth(request, handler, ['gerant']);
}
