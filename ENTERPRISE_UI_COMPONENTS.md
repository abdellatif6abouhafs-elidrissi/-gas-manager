# GasManager Enterprise - React Component Architecture
## Gérant Dashboard: Quick-Close Shift Interface

### Design Philosophy
**Goal:** Close a shift in <2 minutes with minimal data entry.
- **Pre-populated data:** Opening cash, meter readings, corporate vouchers from database
- **One-click actions:** Auto-calculate expected cash, validate meter readings
- **Progressive disclosure:** Show advanced options only when needed
- **Real-time feedback:** Instant discrepancy alerts with visual indicators

---

## Component Tree Structure

```
GerantDashboard/
├── ActiveShiftCard (Main Container)
│   ├── ShiftHeader
│   │   ├── ShiftInfo (Start time, shift ID)
│   │   └── StatusBadge (Active/Closing)
│   │
│   ├── QuickSummary (4-card stats)
│   │   ├── StatCard "Opening Cash"
│   │   ├── StatCard "Expected Revenue"
│   │   ├── StatCard "Fuel Sold"
│   │   └── StatCard "Est. Cash"
│   │
│   ├── MeterReadingsPanel
│   │   ├── MeterReadingCard (per pump)
│   │   │   ├── PumpNumber
│   │   │   ├── StartIndex (read-only)
│   │   │   ├── EndIndex (input)
│   │   │   ├── AutoCalculate (liters, amount)
│   │   │   └── ValidationIcon (checkmark/warning)
│   │   └── AddMeterButton (for extra meters)
│   │
│   ├── DeductionsPanel (Vouchers, TPE)
│   │   ├── CorporateVouchersList
│   │   │   ├── VoucherChip (removable)
│   │   │   └── TotalVouchersAmount
│   │   ├── TPETransactionsList
│   │   │   ├── TPEChip (per transaction)
│   │   │   └── TotalTPEAmount
│   │   └── DeductionsTotal
│   │
│   ├── CashReconciliationPanel (CRITICAL)
│   │   ├── OpeningCashDisplay
│   │   ├── Plus FuelSalesAmount
│   │   ├── Minus DeductionsAmount
│   │   ├── Equals ExpectedCashAmount (bold, large)
│   │   ├── VsActualCashInput
│   │   ├── DiscrepancyIndicator
│   │   │   ├── DiscrepancyAmount (color-coded)
│   │   │   ├── DiscrepancyPercent
│   │   │   ├── Status Badge (OK/SHORTAGE/SURPLUS)
│   │   │   └── WarningMessage (if needed)
│   │   └── ValidateButton
│   │
│   └── ActionButtons
│       ├── SaveDraft (auto-saves every 10s)
│       ├── ValidateReconciliation (pre-submit check)
│       └── FinalizeShift (submit when everything OK)

ShiftClosureModal/
├── ConfirmationScreen
│   ├── Summary (opening cash + fuel - deductions = expected)
│   ├── Discrepancy Alert (if any)
│   └── ConfirmButton / CancelButton

ReconciliationReport/
├── ShiftSummaryReport (displayed after closure)
│   ├── Header (Shift ID, Date, Gérant Name)
│   ├── FuelSalesBreakdown (table: Pump, Fuel Type, Liters, Amount)
│   ├── DeductionsSummary (Vouchers, TPE)
│   ├── CashReconciliation (Expected vs Actual)
│   ├── Discrepancy Alert (if any)
│   └── ExportButtons (PDF, Email to Directeur)

ShiftClosureHistory/
├── ShiftsTable
│   ├── ShiftRow (Pump Attendant, Time, Revenue, Discrepancy, Status)
│   ├── ExpandRow (detail view with reconciliation)
│   └── ExportAllButton
```

---

## Component Code Examples

### 1. MeterReadingCard Component

```tsx
/**
 * MeterReadingCard
 * 
 * Displays start/end meter readings for a single pump.
 * Auto-calculates liters sold and amount when user enters end index.
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MeterReadingCardProps {
  pumpId: string;
  pumpNumber: number;
  fuelType: 'GASOIL' | 'ESSENCE' | 'GPL';
  startIndex: number;
  currentPrice: number;
  onUpdate: (endIndex: number) => void;
  readOnly?: boolean;
}

export const MeterReadingCard: React.FC<MeterReadingCardProps> = ({
  pumpId,
  pumpNumber,
  fuelType,
  startIndex,
  currentPrice,
  onUpdate,
  readOnly = false,
}) => {
  const [endIndex, setEndIndex] = useState('');
  const [litersCalculated, setLitersCalculated] = useState(0);
  const [amountCalculated, setAmountCalculated] = useState(0);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Auto-calculate when end index is entered
    if (endIndex) {
      const end = parseFloat(endIndex);
      if (end > startIndex) {
        const liters = end - startIndex;
        const amount = liters * currentPrice;
        setLitersCalculated(liters);
        setAmountCalculated(amount);
        setIsValid(true);
        onUpdate(end);
      } else {
        setIsValid(false);
      }
    }
  }, [endIndex, startIndex, currentPrice, onUpdate]);

  // Fuel type colors
  const fuelColors: Record<string, string> = {
    GASOIL: 'bg-blue-100 border-blue-300',
    ESSENCE: 'bg-amber-100 border-amber-300',
    GPL: 'bg-red-100 border-red-300',
  };

  const fuelLabels: Record<string, string> = {
    GASOIL: 'Diesel',
    ESSENCE: 'Essence',
    GPL: 'GPL',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${fuelColors[fuelType]} ${readOnly ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700">Pump #{pumpNumber}</span>
          <span className="text-xs px-2 py-1 bg-white rounded font-medium">
            {fuelLabels[fuelType]}
          </span>
        </div>
        {isValid && <CheckCircle className="w-5 h-5 text-green-600" />}
        {endIndex && !isValid && <AlertCircle className="w-5 h-5 text-red-600" />}
      </div>

      {/* Meter Readings */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Start Index (Read-only) */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Start Index
          </label>
          <div className="bg-white px-3 py-2 rounded border border-gray-300 font-mono text-lg font-bold">
            {startIndex.toFixed(3)}
          </div>
        </div>

        {/* End Index (Editable) */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            End Index
          </label>
          <input
            type="number"
            step="0.001"
            value={endIndex}
            onChange={(e) => setEndIndex(e.target.value)}
            placeholder="Enter ending meter"
            disabled={readOnly}
            className="w-full px-3 py-2 rounded border border-gray-300 font-mono text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Calculations (Auto-populated) */}
      {endIndex && (
        <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Liters Sold:</span>
            <span className="font-mono font-bold text-lg">{litersCalculated.toFixed(3)} L</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount @ {currentPrice}/L:</span>
            <span className="font-mono font-bold text-lg">{amountCalculated.toFixed(2)} MAD</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {endIndex && !isValid && (
        <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
          End index must be greater than start index ({startIndex.toFixed(3)})
        </div>
      )}
    </div>
  );
};
```

---

### 2. CashReconciliationPanel Component

```tsx
/**
 * CashReconciliationPanel
 *
 * The critical reconciliation display showing expected vs actual cash.
 * Real-time calculation with discrepancy alerting.
 * This is where the shift closure happens.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface CashReconciliationPanelProps {
  openingCash: number;
  fuelSalesAmount: number;
  corporateVouchers: number;
  tpeTransactions: number;
  onClosingCashChange: (amount: number) => void;
  onReconcile: () => Promise<void>;
}

export const CashReconciliationPanel: React.FC<CashReconciliationPanelProps> = ({
  openingCash,
  fuelSalesAmount,
  corporateVouchers,
  tpeTransactions,
  onClosingCashChange,
  onReconcile,
}) => {
  const [closingCash, setClosingCash] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate expected cash
  const expectedCash = openingCash + fuelSalesAmount - corporateVouchers - tpeTransactions;
  const actualCash = parseFloat(closingCash) || 0;
  const discrepancy = expectedCash - actualCash;
  const discrepancyPercent = Math.abs(discrepancy) / expectedCash;

  // Determine status
  const getDiscrepancyStatus = () => {
    if (Math.abs(discrepancy) < 5) return 'OK'; // Min reportable: 5 MAD
    if (discrepancyPercent > 0.005) {
      return discrepancy > 0 ? 'SHORTAGE' : 'SURPLUS';
    }
    return 'OK';
  };

  const discrepancyStatus = getDiscrepancyStatus();

  // Color scheme
  const statusColors: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    OK: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    },
    SHORTAGE: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
    },
    SURPLUS: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    },
  };

  const colors = statusColors[discrepancyStatus];

  return (
    <div className={`p-6 rounded-lg border-2 ${colors.bg} ${colors.border}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Cash Reconciliation (La Caisse)</h3>
        {colors.icon}
      </div>

      {/* Calculation Breakdown */}
      <div className="bg-white rounded p-4 mb-6 space-y-3 font-mono text-sm">
        {/* Opening Cash */}
        <div className="flex justify-between border-b pb-2">
          <span>Opening Cash (Espèces ouverture)</span>
          <span className="font-bold">{openingCash.toFixed(2)} MAD</span>
        </div>

        {/* Plus Fuel Sales */}
        {fuelSalesAmount > 0 && (
          <div className="flex justify-between border-b pb-2 text-blue-700">
            <span className="flex items-center gap-2">
              <span>+</span> Fuel Sales
            </span>
            <span className="font-bold">{fuelSalesAmount.toFixed(2)} MAD</span>
          </div>
        )}

        {/* Minus Corporate Vouchers */}
        {corporateVouchers > 0 && (
          <div className="flex justify-between border-b pb-2 text-red-700">
            <span className="flex items-center gap-2">
              <span>−</span> Corporate Vouchers (Bons)
            </span>
            <span className="font-bold">{corporateVouchers.toFixed(2)} MAD</span>
          </div>
        )}

        {/* Minus TPE */}
        {tpeTransactions > 0 && (
          <div className="flex justify-between border-b pb-2 text-purple-700">
            <span className="flex items-center gap-2">
              <span>−</span> Card Payments (TPE)
            </span>
            <span className="font-bold">{tpeTransactions.toFixed(2)} MAD</span>
          </div>
        )}

        {/* Equals Expected Cash */}
        <div className="flex justify-between pt-2 bg-yellow-50 p-3 rounded border-2 border-yellow-300">
          <span className="font-bold">Expected Cash (Caisse Théorique)</span>
          <span className="font-bold text-lg text-yellow-900">{expectedCash.toFixed(2)} MAD</span>
        </div>
      </div>

      {/* Actual Closing Cash Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Actual Closing Cash (Espèces fermeture)
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            value={closingCash}
            onChange={(e) => {
              setClosingCash(e.target.value);
              onClosingCashChange(parseFloat(e.target.value) || 0);
            }}
            placeholder="Enter actual cash counted"
            className="w-full px-4 py-3 text-2xl font-bold font-mono rounded border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {closingCash && (
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              MAD
            </span>
          )}
        </div>
      </div>

      {/* Discrepancy Display */}
      {closingCash && (
        <div className="bg-white rounded p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Discrepancy (Écart)</span>
            <div className="flex items-center gap-2">
              {discrepancy > 0 ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-600" />
              )}
              <span
                className={`font-mono font-bold text-lg ${
                  discrepancy > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {discrepancy > 0 ? '−' : '+'}
                {Math.abs(discrepancy).toFixed(2)} MAD ({discrepancyPercent.toFixed(3)}%)
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                discrepancyStatus === 'OK'
                  ? 'bg-green-100 text-green-800'
                  : discrepancyStatus === 'SHORTAGE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {discrepancyStatus === 'OK'
                ? '✓ OK'
                : discrepancyStatus === 'SHORTAGE'
                ? 'SHORTAGE (Missing Cash)'
                : 'SURPLUS (Extra Cash)'}
            </span>
          </div>

          {/* Warning Message */}
          {discrepancyStatus !== 'OK' && (
            <div className="mt-3 p-3 rounded bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ Warning:</strong> Cash discrepancy detected. Please verify your counting
                before finalizing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onReconcile}
          disabled={!closingCash || isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition"
        >
          {isLoading ? 'Finalizing...' : 'Finalize Shift'}
        </button>
        <button
          className="flex-1 px-4 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg transition"
        >
          Save as Draft
        </button>
      </div>
    </div>
  );
};
```

---

### 3. Quick Shift Closure Flow

```tsx
/**
 * ShiftClosureFlow
 *
 * Orchestrates the entire shift closure experience.
 * Minimizes user input while maximizing data accuracy.
 */

import React, { useState } from 'react';
import { MeterReadingCard } from './MeterReadingCard';
import { CashReconciliationPanel } from './CashReconciliationPanel';
import { useToast } from '@/hooks/useToast';

export const ShiftClosureFlow: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [closingCash, setClosingCash] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data (fetch from DB in real implementation)
  const shift = {
    id: 'shift_123',
    openingCash: 5000,
    pumps: [
      { id: 'pump_1', number: 1, fuelType: 'GASOIL', startIndex: 1000, currentPrice: 11.50 },
      { id: 'pump_2', number: 2, fuelType: 'ESSENCE', startIndex: 2000, currentPrice: 10.50 },
    ],
    corporateVouchers: [{ id: 'v1', amount: 500 }, { id: 'v2', amount: 300 }],
    tpeTransactions: [{ id: 't1', amount: 1200 }, { id: 't2', amount: 950 }],
  };

  const [endIndexes, setEndIndexes] = useState<Record<string, number>>({});

  // Calculate totals
  const fuelSalesAmount = Object.entries(endIndexes).reduce((acc, [pumpId, endIdx]) => {
    const pump = shift.pumps.find(p => p.id === pumpId);
    if (pump) {
      const liters = endIdx - pump.startIndex;
      return acc + (liters * pump.currentPrice);
    }
    return acc;
  }, 0);

  const corporateVouchers = shift.corporateVouchers.reduce((sum, v) => sum + v.amount, 0);
  const tpeTransactions = shift.tpeTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleReconcile = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/shifts/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: shift.id,
          closingCash,
          meterReadings: Object.entries(endIndexes).map(([pumpId, endIdx]) => ({
            pumpId,
            endIndex: endIdx,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      showSuccess('Shift finalized successfully!');
      // Redirect to confirmation or dashboard
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Reconciliation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shift Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-gray-900">Close Shift</h2>
        <p className="text-gray-600">Shift started at 06:00 AM</p>
      </div>

      {/* Meter Readings Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Meter Readings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shift.pumps.map(pump => (
            <MeterReadingCard
              key={pump.id}
              pumpId={pump.id}
              pumpNumber={pump.number}
              fuelType={pump.fuelType}
              startIndex={pump.startIndex}
              currentPrice={pump.currentPrice}
              onUpdate={(endIdx) => setEndIndexes(prev => ({ ...prev, [pump.id]: endIdx }))}
            />
          ))}
        </div>
      </div>

      {/* Deductions Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Deductions</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Corporate Vouchers (Bons):</span>
            <span className="font-bold">{corporateVouchers.toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Card Payments (TPE):</span>
            <span className="font-bold">{tpeTransactions.toFixed(2)} MAD</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total Deductions:</span>
            <span>{(corporateVouchers + tpeTransactions).toFixed(2)} MAD</span>
          </div>
        </div>
      </div>

      {/* Cash Reconciliation */}
      <CashReconciliationPanel
        openingCash={shift.openingCash}
        fuelSalesAmount={fuelSalesAmount}
        corporateVouchers={corporateVouchers}
        tpeTransactions={tpeTransactions}
        onClosingCashChange={setClosingCash}
        onReconcile={handleReconcile}
      />
    </div>
  );
};
```

---

## Key UX/UI Design Principles

| Principle | Implementation |
|-----------|-----------------|
| **Minimize Input** | Pre-populate all data from DB. Only ask for end meter readings & closing cash. |
| **Real-time Calculation** | Auto-calculate liters, amounts, and expected cash as user types. |
| **Visual Feedback** | Color-coded pump cards, discrepancy alerts, status badges. |
| **Progressive Disclosure** | Show advanced options (edit vouchers, notes) only when needed. |
| **Error Prevention** | Validate each field immediately. Show warnings before submit. |
| **Accessibility** | Large fonts for currency, high contrast for alerts, keyboard navigation. |
| **Mobile-First** | Single-column layout on mobile, grid on desktop. Large touch targets. |
| **Speed** | No page reloads, instant calculations, background autosave. |

---

## Performance Considerations

- **Lazy load:** Shift history table loads only when expanded
- **Debounce:** Meter reading calculations debounced 300ms
- **Optimistic UI:** Show calculations instantly before API response
- **Caching:** Cache pump prices and voucher lists for 5min
- **Background sync:** Auto-save closing cash every 10 seconds

---

## Accessibility Features

- ARIA labels for all form inputs
- Color + text for status indicators (not color alone)
- Keyboard shortcuts: `Ctrl+S` to save, `Ctrl+Enter` to finalize
- Screen reader support for calculation breakdown
- High contrast mode support
- Tab order optimized for quick data entry

---

## Next Steps

1. Implement `useForm` hook for state management
2. Add offline support with service workers
3. Integrate PDF export for reconciliation reports
4. Add multi-shift daily summary view
5. Build notifications for discrepancy alerts
6. Create Directeur approval workflow
