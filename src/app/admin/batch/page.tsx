"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Settings, Play, Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function BatchOperations() {
  const [schoolName, setSchoolName] = useState('Roseville Secondary School');
  const [classLevel, setClassLevel] = useState<'JSS 3' | 'SSS 3'>('JSS 3');
  const [students, setStudents] = useState<any[]>([]);
  const [masterKey, setMasterKey] = useState<Record<string, any>>({});
  
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  
  // State for the hidden PDF renderer
  const [renderStudent, setRenderStudent] = useState<any>(null);

  // 1. Fetch the Target Cohort & Answer Key
  const fetchCohort = async () => {
    setIsFetching(true);
    try {
      // Get the students
      const q = query(
        collection(db, 'Students'), 
        where('organizationId', '==', schoolName),
        where('classLevel', '==', classLevel),
        where('isTestCompleted', '==', true) // Only grab those who finished!
      );
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Get the Answer Key
      const bankSnap = await getDocs(collection(db, 'Assessments_Bank'));
      const keyObj: Record<string, any> = {};
      bankSnap.docs.forEach(doc => { keyObj[doc.id] = doc.data(); });
      setMasterKey(keyObj);
      
      setProgress({ current: 0, total: snap.docs.length, status: 'Ready to Process' });
    } catch (error) {
      console.error("Fetch error:", error);
    }
    setIsFetching(false);
  };

  // 2. The Grading Utility (Needed before AI generation)
  const gradeStudent = (studentData: any) => {
    let correctCount = 0;
    const answers = studentData.finalAnswers || {};
    const breakdownArray: any[] = [];
    const categories: any = {};

    Object.keys(answers).forEach((questionId) => {
      const studentAnswer = answers[questionId];
      const questionData = masterKey[questionId];
      
      if (questionData) {
        const isCorrect = studentAnswer === (questionData.correct_answer || questionData.correctAnswer || questionData.answer);
        if (isCorrect) correctCount++;
        
        const cat = questionData.category || "General";
        if (!categories[cat]) categories[cat] = { correct: 0, total: 0, rawScore: 0 };
        categories[cat].total += 1;
        if (isCorrect) categories[cat].correct += 1;
        
        // Likert scale mapping
        let scoreValue = 0;
        if (studentAnswer === 'Strongly Agree') scoreValue = 4;
        if (studentAnswer === 'Agree') scoreValue = 3;
        if (studentAnswer === 'Disagree') scoreValue = 2;
        if (studentAnswer === 'Strongly Disagree') scoreValue = 1;
        categories[cat].rawScore += scoreValue;

        breakdownArray.push({
          questionId, category: cat, text: questionData.text || "Missing",
          studentAnswer, correctAnswer: questionData.correct_answer || "N/A", isCorrect
        });
      }
    });

    const totalQuestions = Object.keys(answers).length;
    return {
      score: correctCount,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      breakdown: breakdownArray,
      categories
    };
  };

  // 3. The AI Conveyor Belt
  const runBatchAI = async () => {
    setIsGenerating(true);
    let count = 0;
    
    for (const student of students) {
      count++;
      setProgress({ current: count, total: students.length, status: `Extracting AI Data for ${student.name}...` });
      
      // Skip if they already have an AI report!
      if (student.aiReportData) continue;

      try {
        const gradingResult = gradeStudent(student);
        await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id, gradingResult })
        });
      } catch (error) {
        console.error(`Failed AI for ${student.name}:`, error);
      }
    }
    
    setProgress({ current: count, total: students.length, status: 'AI Generation Complete!' });
    setIsGenerating(false);
    await fetchCohort(); // Refresh data to get the new AI JSONs
  };

  // 4. The PDF Conveyor Belt
  const downloadBatchPDFs = async () => {
    setIsDownloading(true);
    const html2pdf = (await import('html2pdf.js')).default;
    let count = 0;

    for (const student of students) {
      // Only process students who have had their AI JSON generated
      if (!student.aiReportData) continue;
      
      count++;
      setProgress({ current: count, total: students.length, status: `Rendering & Downloading PDF for ${student.name}...` });
      
      // 1. Mount the student data to the hidden DOM element
      setRenderStudent({ ...student, grading: gradeStudent(student) });
      
      // 2. Wait 1.5 seconds for React to actually draw the CSS and SVG charts in the hidden div
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 3. Capture and Download
      const element = document.getElementById('hidden-batch-render');
      const opt = {
        margin: 0,
        filename: `${student.name.replace(/\s+/g, '_')}_ACET_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      // 4. Wait 2 seconds before the next download to prevent Chrome from blocking us as spam
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setProgress({ current: count, total: students.length, status: 'All PDFs Downloaded!' });
    setIsDownloading(false);
    setRenderStudent(null); // Clear the hidden DOM
  };

  const aiReadyCount = students.filter(s => s.aiReportData).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-blue-900 mb-2">Batch Operations Center</h1>
          <p className="text-slate-500">Process entire cohorts and automate individual PDF exports.</p>
        </div>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline font-bold">Return to Dashboard</Link>
      </div>

      {/* FILTER & FETCH */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-blue-600"/> Target Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">School Name</label>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full px-4 py-3 rounded-lg border-2 border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Cohort</label>
            <select value={classLevel} onChange={(e) => setClassLevel(e.target.value as any)} className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white">
              <option value="JSS 3">JSS 3 Baseline</option>
              <option value="SSS 3">SSS 3 Readiness</option>
            </select>
          </div>
          <button onClick={fetchCohort} disabled={isFetching} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-900">
            {isFetching ? 'Locating...' : 'Find Completed Tests'}
          </button>
        </div>
      </div>

      {/* THE CONVEYOR BELT UI */}
      {students.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-blue-900">Cohort Queue: {students.length} Students Found</h2>
            <p className="text-slate-500">AI Data Extracted: {aiReadyCount} / {students.length}</p>
          </div>

          {/* PROGRESS BAR */}
          {(isGenerating || isDownloading) && (
            <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex justify-between text-sm font-bold text-blue-900 mb-2">
                <span>{progress.status}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={runBatchAI} 
              disabled={isGenerating || isDownloading || aiReadyCount === students.length}
              className={`p-6 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all ${aiReadyCount === students.length ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
            >
              {aiReadyCount === students.length ? <><CheckCircle /> Step 1: AI Data Complete</> : <><Play /> Step 1: Extract AI Data</>}
            </button>

            <button 
              onClick={downloadBatchPDFs} 
              disabled={isGenerating || isDownloading || aiReadyCount === 0}
              className={`p-6 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all ${isGenerating || isDownloading || aiReadyCount === 0 ? 'bg-slate-200 text-slate-400' : 'bg-green-600 text-white hover:bg-green-700 shadow-md'}`}
            >
              {isDownloading ? <Loader2 className="animate-spin" /> : <><Download /> Step 2: Download {aiReadyCount} PDFs</>}
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* THE HIDDEN DOM FOR PDF RENDERING */}
      {/* ========================================== */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="hidden-batch-render" className="w-[1000px] bg-white text-slate-900 font-sans">
          {renderStudent && renderStudent.aiReportData && (
             <div className="p-8">
               {/* HEADER */}
               <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100">
                  <div>
                    <h1 className="text-3xl font-bold text-blue-900">ACET Intelligence Report</h1>
                    <p className="text-slate-500 mt-1">{renderStudent.name} • {renderStudent.classLevel}</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold text-sm">
                    Score: {renderStudent.grading.percentage}%
                  </div>
               </header>
               
               {/* AI DATA BINDING */}
               <div className="mt-8 bg-blue-900 p-8 rounded-3xl text-white">
                 <p className="text-blue-200 text-sm font-bold uppercase">Recommendation</p>
                 <h2 className="text-4xl font-black mt-2">{renderStudent.aiReportData.recommendation}</h2>
               </div>
               
               <div className="mt-8 p-6 bg-slate-50 rounded-2xl">
                 <h3 className="font-bold text-lg mb-2">Psychometrician's Notes</h3>
                 <p className="text-slate-700">{renderStudent.aiReportData.counselorNotes}</p>
               </div>
             </div>
          )}
        </div>
      </div>

    </div>
  );
}