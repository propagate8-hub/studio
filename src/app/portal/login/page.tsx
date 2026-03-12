"use client";

import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function StudentPortalLogin() {
  const [acetId, setAcetId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (acetId.length > 5 && accessCode.length >= 4) {
        alert("Verification Successful! Initiating Secure Environment...");
      } else {
        setError('Invalid ACET ID or Access Code. Please check your parent\'s email.');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 selection:bg-[#38BDF8] selection:text-white relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#004AAD] rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 border border-gray-700 mb-6 shadow-2xl">
            <ShieldCheck size={40} className="text-[#38BDF8]" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            ACET <span className="text-[#38BDF8]">SECURE</span> PORTAL
          </h1>
          <p className="text-gray-400 font-medium">Candidate Authentication Gateway</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Student ACET ID
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-4 text-gray-500" size={20} />
                  <input 
                    type="text" 
                    placeholder="e.g. ACET-2026-XYZ" 
                    value={acetId}
                    onChange={(e) => setAcetId(e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-900 border-2 border-gray-700 focus:border-[#38BDF8] focus:outline-none text-white font-mono text-lg transition-colors placeholder-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Secure Access Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-gray-500" size={20} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-900 border-2 border-gray-700 focus:border-[#38BDF8] focus:outline-none text-white font-mono text-lg transition-colors placeholder-gray-600"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !acetId || !accessCode}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all flex justify-center items-center gap-2 ${isLoading || !acetId || !accessCode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#004AAD] text-white hover:bg-blue-600 shadow-lg hover:shadow-blue-900/50 hover:-translate-y-1'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Authenticate & Enter <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center px-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            By logging in, you agree to enter a strictly monitored testing environment. Tab-switching, copy-pasting, and external assistance are flagged automatically.
          </p>
        </div>
      </div>
    </div>
  );
}