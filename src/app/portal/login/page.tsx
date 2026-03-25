"use client";

import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2, KeyRound, CheckCircle } from 'lucide-react';

// 🔥 FIREBASE IMPORTS
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; 

export default function StudentPortalLogin() {
  const [acetId, setAcetId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const studentsRef = collection(db, 'Students');
      const q = query(
        studentsRef, 
        where('acetId', '==', acetId),
        where('accessCode', '==', accessCode)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 🔥 SUCCESS! Credentials match exactly.
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
        // 1. Save the student session to the browser so the test engine remembers them!
        sessionStorage.setItem('acetStudentId', studentDoc.id);
        sessionStorage.setItem('acetStudentName', studentData.name);
        sessionStorage.setItem('acetClassLevel', studentData.classLevel);

        setSuccessMessage(`Welcome, ${studentData.name}! Initiating Secure Environment...`);
        
        // 2. Redirect to the newly moved test engine!
        setTimeout(() => {
           window.location.href = `/test-engine`; 
        }, 2000);

      } else {
        // ❌ FAIL: Wrong ID or Code
        setError('Invalid ACET ID or Secure Access Code. Please check your credentials.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError('System connection error. Please try again.');
    }

    setIsLoading(false);
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
            
            {/* ERROR MESSAGE UI */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-medium text-center animate-in fade-in">
                {error}
              </div>
            )}

            {/* SUCCESS MESSAGE UI */}
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle size={18} />
                {successMessage}
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
                    placeholder="e.g. ACET-JSS-XYZ1" 
                    value={acetId}
                    onChange={(e) => setAcetId(e.target.value.toUpperCase().trim())}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-900 border-2 border-gray-700 focus:border-[#38BDF8] focus:outline-none text-white font-mono text-lg transition-colors placeholder-gray-600"
                    required
                    disabled={!!successMessage}
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
                    onChange={(e) => setAccessCode(e.target.value.trim())}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-900 border-2 border-gray-700 focus:border-[#38BDF8] focus:outline-none text-white font-mono text-lg transition-colors placeholder-gray-600"
                    required
                    disabled={!!successMessage}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !acetId || !accessCode || !!successMessage}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all flex justify-center items-center gap-2 ${isLoading || !acetId || !accessCode || !!successMessage ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#004AAD] text-white hover:bg-blue-600 shadow-lg hover:shadow-blue-900/50 hover:-translate-y-1'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Authenticate & Enter <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}