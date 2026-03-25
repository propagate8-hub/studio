"use client";

import React, { useState } from 'react';
import { Users, UploadCloud, Database, Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

// 🔥 FIREBASE IMPORTS
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 

export default function BulkGenerator() {
  const [schoolName, setSchoolName] = useState('');
  const [classLevel, setClassLevel] = useState<'JSS 3' | 'SSS 3'>('JSS 3');
  const [namesInput, setNamesInput] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedStudents, setGeneratedStudents] = useState<any[]>([]);

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 1. Clean up the input (split by new lines, remove empty spaces)
    const rawNames = namesInput.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    
    if (rawNames.length === 0) return setError("Please enter at least one student name.");
    // Firestore limit is 500 writes per batch!
    if (rawNames.length > 500) return setError("Maximum batch size is 500 students. Please split your list.");

    setIsGenerating(true);

    try {
      // 2. Initialize the Firestore Batch Engine
      const batch = writeBatch(db);
      const studentsRef = collection(db, 'Students');
      const results: any[] = [];

      // 3. Loop through every name and mint credentials
      rawNames.forEach(name => {
        const prefix = classLevel === 'JSS 3' ? 'ACET-JSS-' : 'ACET-SSS-';
        const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
        const generatedAcetId = `${prefix}${randomString}`;
        const generatedAccessCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create a new empty document reference
        const newDocRef = doc(studentsRef); 

        // Add the data to our batch package
        batch.set(newDocRef, {
          name: name,
          classLevel: classLevel,
          acetId: generatedAcetId,
          accessCode: generatedAccessCode,
          isTestCompleted: false,
          clientType: 'B2B',               // Enterprise Tagging!
          organizationId: schoolName,      // Enterprise Tagging!
          createdAt: serverTimestamp(),
        });

        // Save locally so we can show them on screen & export to CSV
        results.push({ name, acetId: generatedAcetId, accessCode: generatedAccessCode });
      });

      // 4. 🔥 FIRE THE BATCH! (Sends all students to the database at the exact same time)
      await batch.commit();

      setGeneratedStudents(results);
      setNamesInput(''); // Clear the form

    } catch (err) {
      console.error("Batch Error:", err);
      setError("Failed to generate batch. Check your database connection.");
    }

    setIsGenerating(false);
  };

  const downloadCSV = () => {
    // Create CSV Headers
    let csvContent = "Student Name,School,Class,ACET ID,Secure Access Code\n";
    
    // Add Rows
    generatedStudents.forEach(student => {
      csvContent += `"${student.name}","${schoolName}","${classLevel}","${student.acetId}","${student.accessCode}"\n`;
    });

    // Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${schoolName.replace(/\s+/g, '_')}_ACET_Credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          <UploadCloud className="text-[#004AAD]" /> B2B Bulk Roster Engine
        </h1>
        <p className="text-muted-foreground">Instantly mint up to 500 student credentials at once for partner schools.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* THE INPUT FORM (Takes up 5 columns) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleBulkGenerate} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm font-medium">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Partner School Name</label>
              <input 
                type="text" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Greenwood High School"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#004AAD] focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Assessment Cohort</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setClassLevel('JSS 3')} className={`py-3 rounded-lg font-bold border-2 transition-all ${classLevel === 'JSS 3' ? 'border-[#004AAD] bg-blue-50 text-[#004AAD]' : 'border-gray-200 text-gray-500'}`}>JSS 3 Baseline</button>
                <button type="button" onClick={() => setClassLevel('SSS 3')} className={`py-3 rounded-lg font-bold border-2 transition-all ${classLevel === 'SSS 3' ? 'border-[#004AAD] bg-blue-50 text-[#004AAD]' : 'border-gray-200 text-gray-500'}`}>SSS 3 Readiness</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                <span>Student Roster (Paste Names)</span>
                <span className="text-gray-400 font-normal text-xs">One name per line</span>
              </label>
              <textarea 
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                placeholder="John Doe&#10;Jane Smith&#10;Michael Johnson"
                className="w-full h-48 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#004AAD] focus:outline-none transition-colors resize-none"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={!schoolName || !namesInput || isGenerating}
              className={`w-full py-4 rounded-lg font-black text-lg transition-all flex justify-center items-center gap-2 ${schoolName && namesInput ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-md hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <><Database size={20} /> Execute Batch Generation</>}
            </button>
          </form>
        </div>

        {/* THE OUTPUT TABLE (Takes up 7 columns) */}
        <div className="lg:col-span-7">
          {generatedStudents.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-green-50 p-6 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={28} />
                  <div>
                    <h2 className="text-xl font-bold text-green-900">Successfully Minted!</h2>
                    <p className="text-green-700 text-sm">{generatedStudents.length} profiles created for {schoolName}</p>
                  </div>
                </div>
                <button onClick={downloadCSV} className="bg-white border border-green-200 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm">
                  <Download size={18} /> Export CSV
                </button>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ACET ID</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Access Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {generatedStudents.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">{student.name}</td>
                        <td className="p-4 font-mono text-[#004AAD] font-bold">{student.acetId}</td>
                        <td className="p-4 font-mono text-gray-600">{student.accessCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Users size={48} className="mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-500 mb-2">Awaiting Roster</h3>
              <p className="max-w-md">Paste a list of student names and execute the batch to instantly generate their secure login credentials.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}