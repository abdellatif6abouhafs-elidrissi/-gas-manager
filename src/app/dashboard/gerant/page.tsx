'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Shift {
  _id: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  status: 'open' | 'closed';
}

interface ShiftSummary {
  totalSales: number;
  totalLiters: number;
  salesCount: number;
}

interface Sale {
  _id: string;
  pumpNumber: number;
  fuelType: 'gasoil' | 'essence' | 'gpl';
  liters: number;
  amountMAD: number;
  createdAt: string;
}

export default function GerantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);
  const [todaysShifts, setTodaysShifts] = useState<Shift[]>([]);
  const [activeSales, setActiveSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [pumpNumber, setPumpNumber] = useState('');
  const [fuelType, setFuelType] = useState<'gasoil' | 'essence' | 'gpl'>('gasoil');
  const [liters, setLiters] = useState('');
  const [amountMAD, setAmountMAD] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'gerant') {
      router.push('/login');
    } else {
      loadShifts();
    }
  }, [status, session, router]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      setError('');

      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/gerant/shifts?date=${today}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTodaysShifts(data.shifts || []);

        const open = data.shifts?.find((s: Shift) => s.status === 'open');
        if (open) {
          setActiveShift(open);
          const sales = data.shiftSales?.[open._id] || [];
          const totalSales = sales.reduce((sum: number, sale: Sale) => sum + sale.amountMAD, 0);
          const totalLiters = sales.reduce((sum: number, sale: Sale) => sum + sale.liters, 0);
          setShiftSummary({
            totalSales,
            totalLiters,
            salesCount: sales.length,
          });
          setActiveSales(sales);
        }
      }
    } catch (err) {
      console.error('Error loading shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/shifts/open', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: session?.user?.station,
          openingCash: parseFloat(openingCash),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open shift');
      }

      setShowOpenModal(false);
      setOpeningCash('');
      loadShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    setSubmitting(true);
    setError('');

    try {
      const newSale = {
        _id: Date.now().toString(),
        pumpNumber: parseInt(pumpNumber),
        fuelType,
        liters: parseFloat(liters),
        amountMAD: parseFloat(amountMAD),
        createdAt: new Date().toISOString(),
      } as Sale;

      const response = await fetch('/api/sales/record', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: activeShift._id,
          pumpNumber: newSale.pumpNumber,
          fuelType: newSale.fuelType,
          liters: newSale.liters,
          amountMAD: newSale.amountMAD,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record sale');
      }

      setShowRecordSaleModal(false);
      setPumpNumber('');
      setFuelType('gasoil');
      setLiters('');
      setAmountMAD('');

      const updatedSales = [...activeSales, newSale];
      setActiveSales(updatedSales);
      const totalSales = updatedSales.reduce((sum, sale) => sum + sale.amountMAD, 0);
      const totalLiters = updatedSales.reduce((sum, sale) => sum + sale.liters, 0);
      setShiftSummary({
        totalSales,
        totalLiters,
        salesCount: updatedSales.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/shifts/close', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: activeShift._id,
          closingCash: parseFloat(closingCash),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to close shift');
      }

      setShowCloseModal(false);
      setClosingCash('');
      setActiveShift(null);
      setShiftSummary(null);
      setActiveSales([]);
      loadShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const difference =
    activeShift && shiftSummary && activeShift.openingCash
      ? activeShift.openingCash + shiftSummary.totalSales - (activeShift.closingCash || 0)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GasManager</h1>
            <p className="text-gray-600 text-sm">Shift Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500">Gérant</p>
            </div>
            <button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Active Shift */}
        {activeShift ? (
          <div className="mb-8 bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Active Shift
                </h2>
                <p className="text-gray-600 text-sm">
                  Started at {formatTime(activeShift.startTime)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRecordSaleModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Record Sale
                </button>
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Close Shift
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Opening Cash</p>
                <p className="text-2xl font-bold text-blue-900">
                  {activeShift.openingCash.toFixed(2)} MAD
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-purple-900">
                  {shiftSummary?.totalSales.toFixed(2) || '0.00'} MAD
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {shiftSummary?.salesCount || 0} transactions
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Total Liters</p>
                <p className="text-2xl font-bold text-green-900">
                  {shiftSummary?.totalLiters.toFixed(2) || '0.00'} L
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Expected Cash</p>
                <p className="text-2xl font-bold text-orange-900">
                  {(
                    (activeShift.openingCash || 0) +
                    (shiftSummary?.totalSales || 0)
                  ).toFixed(2)}{' '}
                  MAD
                </p>
              </div>
            </div>

            {/* Sales List */}
            {activeSales.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sales ({activeSales.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">
                          Pump
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">
                          Fuel Type
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">
                          Liters
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">
                          Amount
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSales.map((sale) => (
                        <tr key={sale._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900 font-medium">#{sale.pumpNumber}</td>
                          <td className="px-3 py-2 text-gray-900">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                sale.fuelType === 'gasoil'
                                  ? 'bg-blue-100 text-blue-800'
                                  : sale.fuelType === 'essence'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {sale.fuelType}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-900 text-right">{sale.liters.toFixed(2)} L</td>
                          <td className="px-3 py-2 text-gray-900 text-right font-medium">
                            {sale.amountMAD.toFixed(2)} MAD
                          </td>
                          <td className="px-3 py-2 text-gray-600 text-sm">
                            {formatTime(sale.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-yellow-900 mb-1">
                  No Active Shift
                </h2>
                <p className="text-yellow-700 text-sm">
                  Open a new shift to start recording sales
                </p>
              </div>
              <button
                onClick={() => setShowOpenModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Open New Shift
              </button>
            </div>
          </div>
        )}

        {/* Today's Shifts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Today's Shifts ({todaysShifts.length})
          </h3>

          {todaysShifts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No shifts recorded yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Time
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Opening Cash
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Closing Cash
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todaysShifts.map((shift) => (
                    <tr key={shift._id} className="border-b border-gray-200">
                      <td className="px-4 py-3 text-gray-900">
                        {formatTime(shift.startTime)}
                        {shift.endTime && ` - ${formatTime(shift.endTime)}`}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {shift.openingCash.toFixed(2)} MAD
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {shift.closingCash ? (
                          `${shift.closingCash.toFixed(2)} MAD`
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            shift.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {shift.status === 'open' ? 'Active' : 'Closed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Open New Shift
            </h3>
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Cash Amount (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="Enter amount"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOpenModal(false);
                    setOpeningCash('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                >
                  {submitting ? 'Opening...' : 'Open Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      {showRecordSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Record Sale
            </h3>
            <form onSubmit={handleRecordSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pump Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={pumpNumber}
                  onChange={(e) => setPumpNumber(e.target.value)}
                  placeholder="Enter pump number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as 'gasoil' | 'essence' | 'gpl')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="gasoil">Gasoil</option>
                  <option value="essence">Essence</option>
                  <option value="gpl">GPL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Liters Sold
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  placeholder="Enter liters"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountMAD}
                  onChange={(e) => setAmountMAD(e.target.value)}
                  placeholder="Enter amount"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {liters && amountMAD && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Price per liter:</p>
                  <p className="text-lg font-bold text-green-900">
                    {(parseFloat(amountMAD) / parseFloat(liters)).toFixed(2)} MAD/L
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordSaleModal(false);
                    setPumpNumber('');
                    setFuelType('gasoil');
                    setLiters('');
                    setAmountMAD('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                >
                  {submitting ? 'Recording...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Close Shift
            </h3>
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 mb-1">Expected Total:</p>
                <p className="text-2xl font-bold text-blue-900">
                  {(
                    (activeShift.openingCash || 0) +
                    (shiftSummary?.totalSales || 0)
                  ).toFixed(2)}{' '}
                  MAD
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Closing Cash (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder="Enter amount"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>
              {closingCash && (
                <div
                  className={`p-3 rounded-lg ${
                    Math.abs(
                      parseFloat(closingCash) -
                        ((activeShift.openingCash || 0) +
                          (shiftSummary?.totalSales || 0))
                    ) < 0.01
                      ? 'bg-green-50'
                      : 'bg-orange-50'
                  }`}
                >
                  <p className="text-xs text-gray-600 mb-1">Difference:</p>
                  <p
                    className={`text-lg font-bold ${
                      Math.abs(
                        parseFloat(closingCash) -
                          ((activeShift.openingCash || 0) +
                            (shiftSummary?.totalSales || 0))
                      ) < 0.01
                        ? 'text-green-900'
                        : 'text-orange-900'
                    }`}
                  >
                    {(
                      parseFloat(closingCash) -
                      ((activeShift.openingCash || 0) +
                        (shiftSummary?.totalSales || 0))
                    ).toFixed(2)}{' '}
                    MAD
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseModal(false);
                    setClosingCash('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                >
                  {submitting ? 'Closing...' : 'Close Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
