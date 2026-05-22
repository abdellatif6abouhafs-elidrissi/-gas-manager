/**
 * POST /api/shifts/reconcile
 *
 * Endpoint for closing and reconciling a shift.
 * - Validates meter readings
 * - Calculates expected cash
 * - Compares with actual cash
 * - Flags discrepancies
 * - Generates reconciliation report
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { connectDB } from '@/lib/db';
import ShiftReconciliationService, { ReconciliationInput } from '@/services/ShiftReconciliationService';
import prisma from '@/lib/db';

async function handler(request: NextRequest, user: any, params?: any) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shiftId, closingCash, meterReadings, corporateVoucherIds, tpeTransactionIds } = body;

    // Validation
    if (!shiftId || closingCash === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: shiftId, closingCash' },
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

    // Fetch shift
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        station: true,
        meterReadings: {
          include: {
            pump: {
              select: {
                id: true,
                fuelType: true,
                currentPrice: true,
              },
            },
          },
        },
        corporateVouchers: true,
        tpeTransactions: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Authorization: Only gérant assigned to shift or directeur can close
    const isAssignedPompiste = shift.pompisteId === user.sub;
    const isStationDirecteur = shift.station.directeurId === user.sub;

    if (user.role === 'gerant' && !isAssignedPompiste && !isStationDirecteur) {
      return NextResponse.json(
        { error: 'You can only close your own shifts' },
        { status: 403 }
      );
    }

    // Check shift is not already closed
    if (shift.status !== 'OPEN') {
      return NextResponse.json(
        { error: `Shift is already ${shift.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Build reconciliation input
    const reconciliationInput: ReconciliationInput = {
      shiftId,
      openingCash: Number(shift.openingCash),
      closingCash: Number(closingCash),
      meterReadings: shift.meterReadings.map(mr => ({
        pumpId: mr.pumpId,
        startIndex: Number(mr.startIndex),
        endIndex: Number(mr.endIndex),
        unitPrice: Number(mr.pump.currentPrice),
      })),
      corporateVoucherAmounts: shift.corporateVouchers.map(cv => Number(cv.amountUsed)),
      tpeTransactionAmounts: shift.tpeTransactions.map(tpe => Number(tpe.amount)),
    };

    // Execute reconciliation
    const reconciliationResult = await ShiftReconciliationService.reconcileShift(reconciliationInput);

    // Validate result
    const validation = await ShiftReconciliationService.validateReconciliation(reconciliationResult);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Reconciliation validation failed',
          details: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Update shift status in database
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        closingCash: Number(closingCash),
        status: 'CLOSED',
        endTime: new Date(),
        closedBy: user.sub,
        notes: validation.warnings.length > 0
          ? `Warnings: ${validation.warnings.join('; ')}`
          : null,
      },
      include: {
        pompiste: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Generate daily report if this is the last shift of the day
    const endOfDay = new Date(shift.station.id);
    endOfDay.setHours(23, 59, 59, 999);

    const remainingOpenShifts = await prisma.shift.count({
      where: {
        stationId: shift.stationId,
        status: 'OPEN',
        startTime: {
          gte: new Date(new Date().toISOString().split('T')[0]),
          lte: endOfDay,
        },
      },
    });

    // If no more open shifts, auto-generate daily report
    if (remainingOpenShifts === 0) {
      await ShiftReconciliationService.generateDailyReport(
        shift.stationId,
        new Date(shift.shiftDate)
      );
    }

    // Return comprehensive response
    return NextResponse.json(
      {
        message: 'Shift reconciled successfully',
        shift: {
          id: updatedShift.id,
          status: updatedShift.status,
          pompiste: updatedShift.pompiste,
          openingCash: updatedShift.openingCash,
          closingCash: updatedShift.closingCash,
          closedAt: updatedShift.endTime,
        },
        reconciliation: {
          fuelSalesAmount: reconciliationResult.totalFuelSalesAmount,
          totalFuelLiters: reconciliationResult.totalFuelLiters,
          corporateVouchers: reconciliationResult.totalCorporateVouchers,
          tpeTransactions: reconciliationResult.totalTPETransactions,
          expectedCash: reconciliationResult.expectedCash,
          actualCash: reconciliationResult.actualCash,
          discrepancy: reconciliationResult.discrepancy,
          discrepancyStatus: reconciliationResult.discrepancyStatus,
          discrepancyPercent: reconciliationResult.discrepancyPercent,
        },
        validation: {
          isValid: validation.isValid,
          warnings: validation.warnings,
          errors: validation.errors,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Shift reconciliation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}

export function POST(request: NextRequest) {
  return withAuth(request, handler, ['gerant', 'directeur']);
}
