'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ShiftWithStats {
  _id: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  status: 'open' | 'closed';
  gerant: { _id: string; firstName: string; lastName: string; email: string };
  station: { _id: string; name: string; address: string };
  salesCount: number;
  totalSales: number;
}

interface GerantPerformance {
  name: string;
  totalSales: number;
  totalLiters: number;
  salesCount: number;
}

interface DashboardData {
  stations: any[];
  todaysShifts: ShiftWithStats[];
  salesByFuelType: { gasoil: number; essence: number; gpl: number };
  gerantPerformance: GerantPerformance[];
  totalRevenue: number;
  totalLiters: number;
  totalShifts: number;
}

export default function DirecteurDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'directeur') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/directeur/dashboard', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
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
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const fuelTypeData = dashboardData
    ? [
        { name: 'Gasoil', value: dashboardData.salesByFuelType.gasoil },
        { name: 'Essence', value: dashboardData.salesByFuelType.essence },
        { name: 'GPL', value: dashboardData.salesByFuelType.gpl },
      ].filter(item => item.value > 0)
    : [];

  const FUEL_COLORS = {
    gasoil: '#3b82f6',
    essence: '#f59e0b',
    gpl: '#ef4444',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GasManager</h1>
            <p className="text-gray-600 text-sm">Director Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">Directeur</p>
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

        {dashboardData ? (
          <>
            {/* Revenue Overview - 4 Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm mb-2">Total Revenue (Today)</p>
                <p className="text-3xl font-bold text-blue-900">
                  {dashboardData.totalRevenue.toFixed(2)} MAD
                </p>
                <p className="text-xs text-gray-500 mt-2">{dashboardData.totalShifts} shifts</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <p className="text-gray-600 text-sm mb-2">Total Liters Sold</p>
                <p className="text-3xl font-bold text-green-900">
                  {dashboardData.totalLiters.toFixed(2)} L
                </p>
                <p className="text-xs text-gray-500 mt-2">All fuel types</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <p className="text-gray-600 text-sm mb-2">Active Shifts</p>
                <p className="text-3xl font-bold text-purple-900">
                  {dashboardData.todaysShifts.filter(s => s.status === 'open').length}
                </p>
                <p className="text-xs text-gray-500 mt-2">of {dashboardData.totalShifts} total</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <p className="text-gray-600 text-sm mb-2">Stations</p>
                <p className="text-3xl font-bold text-orange-900">{dashboardData.stations.length}</p>
                <p className="text-xs text-gray-500 mt-2">Total managed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Sales by Fuel Type Chart */}
              <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Fuel Type</h3>
                {fuelTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={fuelTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(0)} MAD`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {fuelTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={FUEL_COLORS[entry.name.toLowerCase() as keyof typeof FUEL_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${(value as number).toFixed(2)} MAD`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">No sales data yet</p>
                )}
              </div>

              {/* Gérant Performance */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gérant Performance (Today)</h3>
                {dashboardData.gerantPerformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Gérant</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-700">Sales</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-700">Liters</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-700">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.gerantPerformance.map((gerant, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-gray-900 font-medium">{gerant.name}</td>
                            <td className="px-4 py-3 text-gray-900 text-right font-medium">
                              {gerant.totalSales.toFixed(2)} MAD
                            </td>
                            <td className="px-4 py-3 text-gray-900 text-right">
                              {gerant.totalLiters.toFixed(2)} L
                            </td>
                            <td className="px-4 py-3 text-gray-900 text-right">
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                {gerant.salesCount}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No gérant data yet</p>
                )}
              </div>
            </div>

            {/* Today's Shifts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Today's Shifts ({dashboardData.todaysShifts.length})
              </h3>

              {dashboardData.todaysShifts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No shifts recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">
                          Gérant
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">
                          Station
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">
                          Time
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Opening Cash
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Sales
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Closing Cash
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.todaysShifts.map((shift) => (
                        <tr key={shift._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {shift.gerant.firstName} {shift.gerant.lastName}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            <div>
                              <p className="font-medium">{shift.station.name}</p>
                              <p className="text-xs text-gray-500">{shift.station.address}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {formatTime(shift.startTime)}
                            {shift.endTime && ` - ${formatTime(shift.endTime)}`}
                          </td>
                          <td className="px-4 py-3 text-gray-900 text-right font-medium">
                            {shift.openingCash.toFixed(2)} MAD
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-gray-900 font-medium">
                              {shift.totalSales.toFixed(2)} MAD
                            </div>
                            <div className="text-xs text-gray-500">
                              {shift.salesCount} transactions
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-900 text-right font-medium">
                            {shift.closingCash
                              ? `${shift.closingCash.toFixed(2)} MAD`
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
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
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
