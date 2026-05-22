'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Landing() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(5);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'gerant') {
        router.push('/dashboard/gerant');
      } else if (session?.user?.role === 'directeur') {
        router.push('/dashboard/directeur');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setInterval(() => {
        setAutoRedirectCountdown(prev => {
          if (prev <= 1) {
            router.push('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Header */}
      <nav className="bg-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-blue-600">
              GM
            </div>
            <span className="text-2xl font-bold text-white">GasManager.ma</span>
          </div>
          {status === 'unauthenticated' && (
            <button
              onClick={() => router.push('/login')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 rounded-lg font-semibold transition"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Manage Your Gas Station Like Never Before
        </h1>
        <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          GasManager.ma is the complete cloud-based solution for Moroccan gas stations. Track shifts, record sales, manage cash, and grow your business with real-time insights.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition"
          >
            Get Started
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="border-2 border-white text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-lg transition"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">
            Powerful Features Built for Your Success
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl mb-4">
                ⏱️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Shift Management</h3>
              <p className="text-gray-700">
                Open and close shifts, track opening/closing cash, and monitor shift duration in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-8 border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-2xl mb-4">
                ⛽
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sales Tracking</h3>
              <p className="text-gray-700">
                Record fuel sales by pump, track Gasoil, Essence, and GPL with automatic price calculations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white text-2xl mb-4">
                💰
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cash Management</h3>
              <p className="text-gray-700">
                Track cash flow, reconcile differences, and manage daily cash operations securely.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-8 border border-orange-200">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white text-2xl mb-4">
                📊
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-700">
                View comprehensive dashboards with revenue summaries, fuel trends, and performance metrics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-8 border border-red-200">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white text-2xl mb-4">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-User Access</h3>
              <p className="text-gray-700">
                Separate dashboards for Gérants (shift workers) and Directeurs (station owners).
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-8 border border-cyan-200">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center text-white text-2xl mb-4">
                ☁️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cloud-Based</h3>
              <p className="text-gray-700">
                Access from anywhere, anytime. Secure, scalable, and built for Morocco's gas industry.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Station?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join stations across Morocco using GasManager.ma to streamline operations and increase profitability.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition inline-block"
          >
            Start Free Trial
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">GasManager.ma</h4>
              <p className="text-sm">Cloud-based gas station management for Morocco.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 GasManager.ma. All rights reserved.</p>
            {status === 'unauthenticated' && autoRedirectCountdown > 0 && (
              <p className="text-blue-400 mt-2">
                Redirecting to login in {autoRedirectCountdown} seconds... or{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="underline hover:text-blue-300"
                >
                  click here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
