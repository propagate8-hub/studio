'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Password is correct! The cookie is set. Send them to the dashboard.
        router.push('/admin/dashboard');
      } else {
        // Wrong password
        setError('Invalid admin password. Access denied.');
        setPassword('');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#004AAD]/10 rounded-full flex items-center justify-center">
            <ShieldCheck size={32} className="text-[#004AAD]" />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-center text-gray-900 mb-2">
          ACET Admin Vault
        </h1>
        <p className="text-center text-gray-500 mb-8 font-medium">
          Enter the master password to access student data and generate AI reports.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="Enter master password..."
                required
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#004AAD] text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Verifying...' : 'Unlock Vault'} 
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
        
      </div>
    </div>
  );
}