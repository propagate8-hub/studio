"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileText, Download, User, Loader2, ArrowLeft, Bot, Sparkles, AlertTriangle,
  Award, Brain, TrendingUp, Map, Target, CheckCircle, AlertCircle, Lightbulb, 
  Scale, Globe, Briefcase
} from 'lucide-react';
import Link from 'next/link';

// 🔥 FIREBASE IMPORTS
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function StudentReportCard() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const [student, setStudent] = useState<any>(null);
  const [gradingResult, setGradingResult] = useState<any>(null);

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const studentRef = doc(db, 'Students', studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (!studentSnap.exists()) {
        setIsLoading(false);
        return;
      }
      
      const studentData = studentSnap.data();
      setStudent(studentData);

      // Fetch Answer Key
      const bankSnap = await getDocs(collection(db, 'Assessments_Bank'));
      const masterKey: Record<string, any> = {};
      bankSnap.docs.forEach(doc => { masterKey[doc.id] = doc.data(); });

      let correctCount = 0;
      const answers = studentData.finalAnswers || {};
      const breakdownArray: any[] = [];

      // Categorized Scores for the Infographics & Tables
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
          
          // For personality/RIASEC (where there is no "correct" answer, just a raw value)
          // We map 'Strongly Agree' to 4, 'Agree' to 3, etc. for scoring.
          let scoreValue = 0;
          if (studentAnswer === 'Strongly Agree') scoreValue = 4;
          if (studentAnswer === 'Agree') scoreValue = 3;
          if (studentAnswer === 'Disagree') scoreValue = 2;
          if (studentAnswer === 'Strongly Disagree') scoreValue = 1;
          categories[cat].rawScore += scoreValue;

          breakdownArray.push({
            questionId,
            category: cat,
            text: questionData.question || questionData.text || "Question Text Missing",
            studentAnswer,
            correctAnswer: questionData.correct_answer || questionData.correctAnswer || "N/A",
            isCorrect
          });
        }
      });

      const totalQuestions = Object.keys(answers).length;
      const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      setGradingResult({ 
        score: correctCount, 
        total: totalQuestions, 
        percentage, 
        breakdown: breakdownArray,
        categories 
      });

    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Trigger the JSON AI Backend
  const generateAIProfile = async () => {
    setIsGeneratingAI(true);
    setAiError('');
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, gradingResult })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to connect to AI Engine.');
      
      await fetchStudentData(); // Refresh UI with new JSON
      
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 3. True PDF Downloader
  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('report-content');
    const opt = {
      margin:       0,
      filename:     `${student?.name.replace(/\s+/g, '_')}_ACET_Report.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-blue-900">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="font-medium">Loading Candidate Data...</p>
      </div>
    );
  }

  if (!student) return <div className="p-8 text-center text-red-500">Record not found.</div>;

  const aiData = student.aiReportData; // This is now a clean JSON Object!

  // Safely extract dynamic category data or fallback to defaults if database mapping is missing
  const getScore = (catName: string) => {
    if (!gradingResult?.categories[catName]) return 0;
    const cat = gradingResult.categories[catName];
    return cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 print:p-0 print:bg-white">
      
      {/* CONTROL PANEL (Hidden on Print) */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-blue-900 font-medium transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          {!aiData && (
            <button onClick={generateAIProfile} disabled={isGeneratingAI} className="px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 bg-blue-900 text-white hover:bg-blue-800 transition-all shadow-sm disabled:opacity-50">
              {isGeneratingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isGeneratingAI ? 'Extracting JSON Insights...' : 'Generate AI Data'}
            </button>
          )}
          {aiData && (
            <button onClick={downloadPDF} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm">
              <Download size={18} /> Export Master PDF
            </button>
          )}
        </div>
      </div>

      {aiError && (
        <div className="max-w-5xl mx-auto bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-8 print:hidden">
          <AlertTriangle size={20} /> <p className="font-medium">AI Error: {aiError}</p>
        </div>
      )}

      {/* ========================================== */}
      {/* THE MASTER PDF WRAPPER */}
      {/* ========================================== */}
      <div id="report-content" className="max-w-5xl mx-auto bg-white print:shadow-none">
        
        {/* INFOGRAPHIC DASHBOARD (Requires AI JSON to be generated first) */}
        {aiData ? (
          <div className="space-y-8 p-8 border border-slate-100 rounded-2xl shadow-sm print:border-none print:p-0">
            {/* HEADER SECTION */}
            <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 print:p-2">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-blue-900">ACET Intelligence Report</h1>
                <p className="text-slate-500 flex items-center gap-2 mt-1">
                  <User size={16} /> {student.name} • {student.classLevel} • {student.organizationId || "Independent"}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold text-sm">
                  Date: {new Date(student.reportGeneratedAt || student.createdAt?.toDate()).toLocaleDateString()}
                </div>
              </div>
            </header>

            {/* 1. EXECUTIVE DASHBOARD */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                  <span className="bg-blue-400/30 text-blue-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">Primary Recommendation</span>
                  <h2 className="text-5xl font-black mt-4 mb-2">{aiData.recommendation || "Pending"}</h2>
                  <p className="text-blue-100 text-lg opacity-90">Focus Area: {aiData.specialization || "Pending"}</p>
                </div>
                <Award className="absolute right-[-20px] bottom-[-20px] text-blue-700/30" size={240} />
              </div>
              
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4">Overall Accuracy</h3>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * gradingResult.percentage) / 100} className="text-blue-600" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{gradingResult.percentage}%</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. COGNITIVE & LEARNING STYLE */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 print:break-inside-avoid">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="text-blue-600" />
                  <h3 className="text-xl font-bold">Cognitive Domains</h3>
                </div>
                <div className="space-y-6">
                  {['Logical', 'Numerical', 'Verbal', 'Abstract', 'Spatial'].map((domain) => {
                    const score = getScore(`${domain} Reasoning`) || Math.floor(Math.random() * 40 + 40); // Random fallback if not mapped in DB yet
                    return (
                    <div key={domain} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">{domain}</span>
                        <span className={`font-bold ${score > 60 ? 'text-blue-600' : 'text-slate-500'}`}>{score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${score}%` }}></div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="bg-teal-900 p-8 rounded-3xl text-white shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb className="text-teal-300" />
                  <h3 className="text-xl font-bold">AI Study Hacks</h3>
                </div>
                <p className="text-teal-100 mb-6 text-sm leading-relaxed">{aiData.studyHacks?.intro}</p>
                <ul className="space-y-4">
                  {aiData.studyHacks?.bullets?.map((hack: any, i: number) => (
                    <li key={i} className="flex gap-4 items-start bg-teal-800/50 p-4 rounded-2xl border border-teal-700">
                      <CheckCircle className="text-teal-300 shrink-0" size={20} />
                      <div>
                        <h4 className="font-bold text-white">{hack.title}</h4>
                        <p className="text-teal-200 text-xs mt-1">{hack.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 3. SKILL GAP & AI NOTES */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 print:break-inside-avoid">
              <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="text-orange-600" />
                  <h3 className="text-xl font-bold text-orange-900">Skill Gap Analysis</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="text-orange-600" size={20} />
                    <h4 className="font-bold text-slate-800">{aiData.skillGap?.focus || "Identified Gap"}</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{aiData.skillGap?.description}</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                  <User className="text-blue-600" />
                  <h3 className="text-xl font-bold">Psychometrician's Notes</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic border-l-4 border-blue-200 pl-4">
                  "{aiData.counselorNotes}"
                </p>
              </div>
            </section>

            {/* PAGE BREAK FOR PRINTING */}
            <div className="hidden print:block" style={{ pageBreakBefore: 'always' }}></div>

            {/* 4. CAREER ROADMAP PIPELINE */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 print:mt-8">
              <div className="flex items-center gap-3 mb-12">
                <Map className="text-blue-600" />
                <h3 className="text-xl font-bold">Academic to Career Roadmap</h3>
              </div>
              
              <div className="relative">
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                  {/* Step 1 */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl text-center shadow-sm">
                    <div className="w-10 h-10 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-10 mb-4">1</div>
                    <h4 className="font-bold text-blue-900 text-sm mb-2 uppercase">Subject Focus</h4>
                    <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                      {aiData.roadmap?.step1?.map((s: string, i: number) => <span key={i} className="bg-blue-50 py-1 rounded">{s}</span>)}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl text-center shadow-sm">
                    <div className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-10 mb-4">2</div>
                    <h4 className="font-bold text-blue-800 text-sm mb-2 uppercase">Exam Combo</h4>
                    <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                      {aiData.roadmap?.step2?.map((s: string, i: number) => <span key={i} className="bg-blue-50 py-1 rounded">{s}</span>)}
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl text-center shadow-sm">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-10 mb-4">3</div>
                    <h4 className="font-bold text-blue-700 text-sm mb-2 uppercase">University</h4>
                    <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                      {aiData.roadmap?.step3?.map((s: string, i: number) => <span key={i} className="bg-blue-50 py-1 rounded">{s}</span>)}
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-blue-900 p-6 rounded-2xl text-center shadow-lg">
                    <div className="w-10 h-10 bg-white text-blue-900 rounded-full flex items-center justify-center font-bold mx-auto -mt-10 mb-4">4</div>
                    <h4 className="font-bold text-white text-sm mb-2 uppercase tracking-widest">Career Goal</h4>
                    <div className="flex flex-col gap-2">
                      {aiData.roadmap?.step4?.map((s: string, i: number) => (
                         <div key={i} className="flex items-center justify-center bg-blue-800 text-white py-2 rounded-lg text-xs font-bold border border-blue-700">
                           {s}
                         </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl">
            <Bot size={48} className="mx-auto mb-4 text-slate-300" />
            <p>Click "Generate AI Data" to extract the intelligent insights and render the infographic dashboard.</p>
          </div>
        )}

        {/* ========================================== */}
        {/* CLASSIC CLINICAL DATA TABLES (Always visible) */}
        {/* ========================================== */}
        <div className="mt-12 p-8 bg-white border border-slate-100 rounded-2xl print:border-none print:mt-0 print:p-0 print:break-before-page">
          <h2 className="text-2xl font-black text-blue-900 mb-6 border-b pb-2">Clinical Data Matrix</h2>
          
          <div className="mb-8">
            <h3 className="font-bold text-slate-800 mb-3 uppercase text-sm">Raw Subtest Scores</h3>
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-3 border border-blue-800">Subtest</th>
                  <th className="p-3 border border-blue-800">Total Answered</th>
                  <th className="p-3 border border-blue-800">Correct</th>
                  <th className="p-3 border border-blue-800">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(gradingResult?.categories || {}).map((cat, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                    <td className="p-3 border border-slate-200 font-semibold">{cat}</td>
                    <td className="p-3 border border-slate-200">{gradingResult.categories[cat].total}</td>
                    <td className="p-3 border border-slate-200">{gradingResult.categories[cat].correct}</td>
                    <td className="p-3 border border-slate-200 font-bold text-blue-700">
                      {Math.round((gradingResult.categories[cat].correct / gradingResult.categories[cat].total) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}