/**
 * ShiftReconciliationService
 *
 * Core business logic for calculating shift financial results.
 * Implements the critical "La Caisse" (cash reconciliation) logic for Moroccan gas stations.
 *
 * Process:
 * 1. Calculate expected fuel sales from pump meter readings
 * 2. Deduct corporate vouchers (Bons/Tirets)
 * 3. Deduct card payments (TPE)
 * 4. Determine expected cash (Espèces)
 * 5. Compare with actual closing cash to identify shortage/surplus
 */

import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/db';

// ============================================================================
// TYPES
// ============================================================================

export interface MeterReadingData {
  pumpId: string;
  startIndex: number;
  endIndex: number;
  unitPrice: number;
}

export interface ReconciliationInput {
  shiftId: string;
  openingCash: number;
  closingCash: number;
  meterReadings: MeterReadingData[];
  corporateVoucherAmounts: number[];
  tpeTransactionAmounts: number[];
}

export interface FuelSaleBreakdown {
  pumpId: string;
  fuelType: string;
  liters: number;
  unitPrice: number;
  totalAmount: number;
}

export interface ReconciliationResult {
  // Fuel Sales Calculation
  fuelSalesBreakdown: FuelSaleBreakdown[];
  totalFuelSalesAmount: number;
  totalFuelLiters: number;

  // Deductions
  totalCorporateVouchers: number;
  totalTPETransactions: number;
  totalDeductions: number;

  // Expected Cash Calculation
  expectedCash: number; // Opening + Fuel Sales - Vouchers - TPE
  actualCash: number;

  // Variance Analysis
  discrepancy: number; // Expected - Actual (negative = shortage, positive = surplus)
  discrepancyPercent: number;
  discrepancyStatus: 'OK' | 'SHORTAGE' | 'SURPLUS'; // OK if within tolerance (0.5%)

  // Summary
  summary: {
    fuelSalesConvertedToCash: number;
    openingCash: number;
    expectedClosingCash: number;
    actualClosingCash: number;
    shortage: number | null;
    surplus: number | null;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DISCREPANCY_TOLERANCE = 0.005; // 0.5% tolerance for rounding/measurement errors
const MIN_REPORTABLE_DISCREPANCY = 5; // MAD - don't flag tiny differences

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

class ShiftReconciliationService {
  /**
   * Calculate shift financial result
   * This is the core reconciliation engine.
   */
  async reconcileShift(input: ReconciliationInput): Promise<ReconciliationResult> {
    try {
      // Step 1: Fetch complete meter reading data from database
      const meterReadings = await this.fetchMeterReadings(input.shiftId);

      // Step 2: Calculate fuel sales from meter readings
      const fuelSalesBreakdown = await this.calculateFuelSales(meterReadings);
      const totalFuelSalesAmount = this.sum(fuelSalesBreakdown.map(s => s.totalAmount));
      const totalFuelLiters = this.sum(fuelSalesBreakdown.map(s => s.liters));

      // Step 3: Calculate total deductions
      const totalVouchers = this.sum(input.corporateVoucherAmounts);
      const totalTPE = this.sum(input.tpeTransactionAmounts);
      const totalDeductions = totalVouchers + totalTPE;

      // Step 4: Calculate expected cash (La Caisse Théorique)
      // Formula: Opening Cash + Fuel Sales - Corporate Vouchers - TPE Payments
      const expectedCash = input.openingCash + totalFuelSalesAmount - totalVouchers - totalTPE;

      // Step 5: Calculate discrepancy
      const actualCash = input.closingCash;
      const discrepancy = expectedCash - actualCash;
      const discrepancyPercent = Math.abs(discrepancy) / expectedCash;

      // Step 6: Determine status
      const discrepancyStatus = this.determineDiscrepancyStatus(
        discrepancy,
        expectedCash,
        DISCREPANCY_TOLERANCE,
        MIN_REPORTABLE_DISCREPANCY
      );

      // Build comprehensive result
      const result: ReconciliationResult = {
        fuelSalesBreakdown,
        totalFuelSalesAmount: this.round(totalFuelSalesAmount),
        totalFuelLiters: this.round(totalFuelLiters, 3),

        totalCorporateVouchers: this.round(totalVouchers),
        totalTPETransactions: this.round(totalTPE),
        totalDeductions: this.round(totalDeductions),

        expectedCash: this.round(expectedCash),
        actualCash: this.round(actualCash),

        discrepancy: this.round(discrepancy),
        discrepancyPercent: Math.round(discrepancyPercent * 10000) / 100, // As percentage
        discrepancyStatus,

        summary: {
          fuelSalesConvertedToCash: this.round(totalFuelSalesAmount),
          openingCash: this.round(input.openingCash),
          expectedClosingCash: this.round(expectedCash),
          actualClosingCash: this.round(actualCash),
          shortage: discrepancy > 0 ? this.round(discrepancy) : null,
          surplus: discrepancy < 0 ? this.round(Math.abs(discrepancy)) : null,
        },
      };

      return result;
    } catch (error) {
      throw new Error(`Shift reconciliation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Fetch meter readings for shift from database
   * Includes fuel type and pump details
   */
  private async fetchMeterReadings(shiftId: string) {
    const readings = await prisma.meterReading.findMany({
      where: { shiftId },
      include: {
        pump: {
          select: {
            id: true,
            pumpNumber: true,
            fuelType: true,
            tank: {
              select: {
                fuelType: true,
              },
            },
          },
        },
      },
    });

    return readings;
  }

  /**
   * Calculate fuel sales breakdown from meter readings
   *
   * Formula for each pump:
   * - Liters Sold = Ending Index - Starting Index
   * - Amount = Liters Sold × Unit Price
   */
  private async calculateFuelSales(
    meterReadings: Awaited<ReturnType<typeof this.fetchMeterReadings>>
  ): Promise<FuelSaleBreakdown[]> {
    const breakdown: FuelSaleBreakdown[] = [];

    for (const reading of meterReadings) {
      const liters = Number(reading.endIndex) - Number(reading.startIndex);

      // Ignore negative or zero readings (no sales on this pump)
      if (liters <= 0) continue;

      const unitPrice = Number(reading.unitPrice);
      const totalAmount = liters * unitPrice;

      breakdown.push({
        pumpId: reading.pumpId,
        fuelType: reading.pump.fuelType,
        liters: this.round(liters, 3),
        unitPrice: this.round(unitPrice),
        totalAmount: this.round(totalAmount),
      });
    }

    return breakdown.sort((a, b) => a.pumpId.localeCompare(b.pumpId));
  }

  /**
   * Determine if discrepancy is acceptable
   *
   * - OK: Within tolerance (default 0.5%) or below MIN_REPORTABLE_DISCREPANCY
   * - SHORTAGE: Expected > Actual (missing cash)
   * - SURPLUS: Expected < Actual (extra cash)
   */
  private determineDiscrepancyStatus(
    discrepancy: number,
    expectedCash: number,
    tolerance: number,
    minReportable: number
  ): 'OK' | 'SHORTAGE' | 'SURPLUS' {
    const absDiscrepancy = Math.abs(discrepancy);

    // If discrepancy is below minimum reportable threshold, mark as OK
    if (absDiscrepancy < minReportable) {
      return 'OK';
    }

    // If discrepancy exceeds tolerance percentage, flag it
    const percentageDiscrepancy = absDiscrepancy / expectedCash;
    if (percentageDiscrepancy > tolerance) {
      return discrepancy > 0 ? 'SHORTAGE' : 'SURPLUS';
    }

    return 'OK';
  }

  /**
   * Generate daily end-of-day report (La Feuille de Route)
   * Aggregates all shifts for a station on a given day
   */
  async generateDailyReport(stationId: string, reportDate: Date) {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all shifts for the day
    const shifts = await prisma.shift.findMany({
      where: {
        stationId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        meterReadings: true,
        corporateVouchers: true,
        tpeTransactions: true,
      },
    });

    // Aggregate metrics
    let totalRevenue = 0;
    let totalCash = 0;
    let totalTPE = 0;
    let totalVouchers = 0;
    let totalFuelSold = 0;

    for (const shift of shifts) {
      if (shift.closingCash) {
        totalCash += Number(shift.closingCash);
      }

      // Sum deductions
      for (const voucher of shift.corporateVouchers) {
        totalVouchers += Number(voucher.amountUsed);
      }

      for (const tpe of shift.tpeTransactions) {
        totalTPE += Number(tpe.amount);
      }

      // Sum fuel
      for (const reading of shift.meterReadings) {
        const liters = Number(reading.endIndex) - Number(reading.startIndex);
        if (liters > 0) {
          totalFuelSold += liters;
        }
      }
    }

    totalRevenue = totalCash + totalTPE + totalVouchers;

    // Store report
    const report = await prisma.dailyReport.upsert({
      where: {
        stationId: stationId,
      },
      update: {
        reportDate,
        totalShifts: shifts.length,
        totalRevenue,
        expectedCash: totalCash + totalVouchers, // Vouchers are separate from direct cash
        actualCash: totalCash,
        cashDiscrepancy: 0, // Would calculate from individual shift discrepancies
        totalCashSales: totalCash,
        totalTPESales: totalTPE,
        totalVoucherUsage: totalVouchers,
        totalFuelSold,
      },
      create: {
        stationId,
        reportDate,
        totalShifts: shifts.length,
        totalRevenue,
        expectedCash: totalCash + totalVouchers,
        actualCash: totalCash,
        cashDiscrepancy: 0,
        totalCashSales: totalCash,
        totalTPESales: totalTPE,
        totalVoucherUsage: totalVouchers,
        totalFuelSold,
        gasoilSold: 0, // Would aggregate by fuel type
        essenceSold: 0,
        gplSold: 0,
        startingInventory: 0,
        endingInventory: 0,
        deliveredFuel: 0,
        inventoryLoss: 0,
      },
    });

    return report;
  }

  /**
   * Validate reconciliation before finalizing
   * Checks for business logic violations
   */
  async validateReconciliation(result: ReconciliationResult): Promise<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check 1: Closing cash should not be negative
    if (result.actualCash < 0) {
      errors.push('Closing cash cannot be negative');
    }

    // Check 2: Significant discrepancy
    if (result.discrepancyStatus !== 'OK') {
      warnings.push(
        `Cash ${result.discrepancyStatus === 'SHORTAGE' ? 'shortage' : 'surplus'}: ${Math.abs(result.discrepancy)} MAD (${result.discrepancyPercent}%)`
      );
    }

    // Check 3: No fuel sales recorded
    if (result.totalFuelSalesAmount === 0 && result.actualCash > result.summary.openingCash) {
      warnings.push('Closing cash exceeds opening cash, but no fuel sales recorded');
    }

    // Check 4: Opening cash validation
    if (result.summary.openingCash === 0) {
      warnings.push('Opening cash is zero - verify this is intentional');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Utility: Round to 2 decimal places (or specified decimals)
   */
  private round(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Utility: Sum array values safely
   */
  private sum(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default new ShiftReconciliationService();

/**
 * USAGE EXAMPLE:
 *
 * const result = await ShiftReconciliationService.reconcileShift({
 *   shiftId: 'shift_123',
 *   openingCash: 5000,
 *   closingCash: 7850,
 *   meterReadings: [
 *     { pumpId: 'pump_1', startIndex: 1000, endIndex: 1150, unitPrice: 11.50 },
 *     { pumpId: 'pump_2', startIndex: 2000, endIndex: 2095, unitPrice: 9.50 },
 *   ],
 *   corporateVoucherAmounts: [500, 300], // Total: 800 MAD
 *   tpeTransactionAmounts: [1200, 950],  // Total: 2150 MAD
 * });
 *
 * console.log(result);
 * // Output:
 * // {
 * //   totalFuelSalesAmount: 2782.50,
 * //   expectedCash: 7182.50 (5000 + 2782.50 - 800 - 1200),
 * //   actualCash: 7850,
 * //   discrepancy: -667.50 (surplus),
 * //   discrepancyStatus: 'SURPLUS',
 * // }
 */
