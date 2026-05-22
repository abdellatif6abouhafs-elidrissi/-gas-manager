'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DirecteurDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'directeur') {
      router.push('/login');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            GasManager - Directeur Dashboard
          </h1>
          <button
            onClick={() => signOut()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {session?.user?.name}
          </h2>
          <p className="text-gray-600 mb-4">Email: {session?.user?.email}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">
                Revenue Reports
              </h3>
              <p className="text-indigo-700 text-sm">
                View daily, weekly, and monthly revenue by station
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
              <h3 className="font-semibold text-teal-900 mb-2">
                Station Overview
              </h3>
              <p className="text-teal-700 text-sm">
                Monitor all your stations and gérants in one place
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6">
              <h3 className="font-semibold text-rose-900 mb-2">
                Shift Management
              </h3>
              <p className="text-rose-700 text-sm">
                View and manage all shifts across stations
              </p>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
              <h3 className="font-semibold text-cyan-900 mb-2">
                Analytics
              </h3>
              <p className="text-cyan-700 text-sm">
                Sales trends and performance analytics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
