"use client";

import React, { useState } from 'react';
import { UserPlus, Database, CheckCircle, Copy, Loader2 } from 'lucide-react';

// 🔥 FIREBASE IMPORTS
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function GenerateCredentials() {
  const [studentName, setStudentName] = useState('');
  const [classLevel, setClassLevel] = useState<'JSS 3' | 'SSS 3'>('JSS 3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newStudent, setNewStudent] = useState<{name: string, acetId: string, accessCode: string} | null>(null);

  const generateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const prefix = classLevel === 'JSS 3' ? 'ACET-JSS-' : 'ACET-SSS-';
      const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedAcetId = `${prefix}${randomString}`;
      const generatedAccessCode = Math.floor(100000 + Math.random() * 900000).toString();

      await addDoc(collection(db, 'Students'), {
        name: studentName,
        classLevel: classLevel,
        acetId: generatedAcetId,
        accessCode: generatedAccessCode,
        isTestCompleted: false,
        createdAt: serverTimestamp(),
      });

      setNewStudent({
        name: studentName,
        acetId: generatedAcetId,
        accessCode: generatedAccessCode
      });
      
      setStudentName('');
    } catch (error) {
      console.error("Error generating student:", error);
      alert("Failed to connect to the database. Check your Firebase connection.");
    }
    
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Generate Credentials</h1>
        <p className="text-muted-foreground">Mint secure ACET IDs and Access Codes for new candidates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* THE GENERATOR FORM */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <UserPlus className="text-[#004AAD]" /> Add New Candidate
          </h2>
          
          <form onSubmit={generateCredentials} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Student Full Name</label>
              <input 
                type="text" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. David Johnson"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#004AAD] focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Assessment Cohort</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setClassLevel('JSS 3')}
                  className={`py-3 rounded-lg font-bold border-2 transition-all ${classLevel === 'JSS 3' ? 'border-[#004AAD] bg-blue-50 text-[#004AAD]' : 'border-gray-200 text-gray-500'}`}
                >
                  JSS 3 Baseline
                </button>
                <button 
                  type="button"
                  onClick={() => setClassLevel('SSS 3')}
                  className={`py-3 rounded-lg font-bold border-2 transition-all ${classLevel === 'SSS 3' ? 'border-[#004AAD] bg-blue-50 text-[#004AAD]' : 'border-gray-200 text-gray-500'}`}
                >
                  SSS 3 Readiness
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!studentName || isGenerating}
              className={`w-full py-4 rounded-lg font-black text-lg transition-all flex justify-center items-center gap-2 ${studentName ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-md hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <><Database size={20} /> Mint ACET Credentials</>}
            </button>
          </form>
        </div>

        {/* THE SUCCESS DISPLAY */}
        {newStudent && (
          <div className="bg-green-50 p-8 rounded-xl shadow-sm border border-green-200 animate-in fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Profile Activated!</h2>
            <p className="text-green-800 mb-8">
              {newStudent.name} is now registered in the database.
            </p>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-green-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ACET ID</p>
                  <p className="font-mono font-bold text-xl text-gray-900">{newStudent.acetId}</p>
                </div>
                <button onClick={() => copyToClipboard(newStudent.acetId)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600">
                  <Copy size={20} />
                </button>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Secure Access Code</p>
                  <p className="font-mono font-bold text-xl text-gray-900">{newStudent.accessCode}</p>
                </div>
                <button onClick={() => copyToClipboard(newStudent.accessCode)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600">
                  <Copy size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}