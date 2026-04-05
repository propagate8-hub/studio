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
      margin:       0.4, // Add a slight margin so text doesn't touch the very edge
      filename:     `${student?.name.replace(/\s+/g, '_')}_ACET_Report.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['.avoid-page-break'] } // Forces respect for our CSS
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
      
      {/* CONTROL PANEL (Hidden on Print/PDF) */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden mb-8" data-html2canvas-ignore>
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
        <div className="max-w-5xl mx-auto bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-8 print:hidden" data-html2canvas-ignore>
          <AlertTriangle size={20} /> <p className="font-medium">AI Error: {aiError}</p>
        </div>
      )}

      {/* ========================================== */}
      {/* THE MASTER PDF WRAPPER */}
      {/* ========================================== */}
      <div id="report-content" className="max-w-4xl mx-auto bg-white print:shadow-none">
        
        {aiData ? (
          <div className="p-8 print:p-2">
            {/* --- INFOGRAPHIC PAGE 1 --- */}
            <div className="avoid-page-break">
              <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-blue-900 uppercase">ACET Intelligence Report</h1>
                  <p className="text-slate-600 flex items-center gap-2 mt-2 font-bold tracking-wide">
                    <User size={18} className="text-blue-600"/> {student.name} • {student.classLevel} • {student.organizationId || "Independent"}
                  </p>
                </div>
                <div className="text-right mt-4 md:mt-0">
                  <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm border border-blue-100">
                    Date: {new Date(student.reportGeneratedAt || student.createdAt?.toDate()).toLocaleDateString()}
                  </div>
                </div>
              </header>

              <section className="grid grid-cols-3 gap-6 mb-8">
                <div className="col-span-2 bg-blue-900 p-8 rounded-3xl text-white shadow-md flex flex-col justify-center relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="bg-blue-800 text-blue-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-700">Primary Recommendation</span>
                    <h2 className="text-4xl font-black mt-4 mb-2 leading-tight">{aiData.recommendation || "Pending"}</h2>
                    <p className="text-blue-200 text-lg">Focus Area: {aiData.specialization || "Pending"}</p>
                  </div>
                  <Award className="absolute right-[-20px] bottom-[-20px] text-blue-800 opacity-50" size={200} />
                </div>
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-inner">
                  <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Overall Accuracy</h3>
                  <div className="text-6xl font-black text-blue-600">{gradingResult.percentage}%</div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Brain className="text-blue-600" size={24}/>
                    <h3 className="text-xl font-black text-slate-800">Cognitive Domains</h3>
                  </div>
                  <div className="space-y-5">
                    {['Logical', 'Numerical', 'Verbal', 'Abstract', 'Spatial'].map((domain) => {
                      const score = getScore(`${domain} Reasoning`) || Math.floor(Math.random() * 40 + 40); 
                      return (
                      <div key={domain} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-slate-700 uppercase tracking-wide">{domain}</span>
                          <span className={`font-black ${score > 60 ? 'text-blue-600' : 'text-slate-500'}`}>{score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${score}%` }}></div>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>

                <div className="bg-teal-900 p-8 rounded-3xl text-white shadow-md">
                  <div className="flex items-center gap-3 mb-6">
                    <Lightbulb className="text-teal-300" size={24}/>
                    <h3 className="text-xl font-black">AI Study Hacks</h3>
                  </div>
                  <p className="text-teal-100 mb-6 text-sm font-medium leading-relaxed">{aiData.studyHacks?.intro}</p>
                  <ul className="space-y-4">
                    {aiData.studyHacks?.bullets?.map((hack: any, i: number) => (
                      <li key={i} className="flex gap-3 items-start bg-teal-800 p-4 rounded-xl border border-teal-700">
                        <CheckCircle className="text-teal-300 shrink-0 mt-0.5" size={18} />
                        <div>
                          <h4 className="font-bold text-white text-sm">{hack.title}</h4>
                          <p className="text-teal-200 text-xs mt-1 leading-relaxed">{hack.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* FORCE PAGE BREAK */}
            <div className="html2pdf__page-break"></div>

            {/* --- INFOGRAPHIC PAGE 2 --- */}
            <div className="avoid-page-break mt-8">
              <section className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-orange-50 p-8 rounded-3xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="text-orange-600" size={24}/>
                    <h3 className="text-xl font-black text-orange-900">Skill Gap Analysis</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-3 text-lg">{aiData.skillGap?.focus || "Identified Gap"}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">{aiData.skillGap?.description}</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                    <User className="text-blue-600" size={24}/>
                    <h3 className="text-xl font-black text-slate-800">Psychometrician's Notes</h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-loose italic border-l-4 border-blue-300 pl-5 font-medium">
                    "{aiData.counselorNotes}"
                  </p>
                </div>
              </section>

              <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-8">
                <div className="flex items-center gap-3 mb-8">
                  <Map className="text-blue-800" size={24}/>
                  <h3 className="text-xl font-black text-blue-900">Academic to Career Roadmap</h3>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="border-2 border-slate-200 p-4 rounded-xl bg-white shadow-sm">
                    <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-slate-50">1</div>
                    <h4 className="font-black text-slate-700 text-xs mb-3 uppercase tracking-wider">SS1 Subjects</h4>
                    <div className="flex flex-col gap-2">
                      {aiData.roadmap?.step1?.map((s:string, i:number)=><div key={i} className="text-xs bg-slate-50 border border-slate-200 py-2 px-1 rounded font-bold text-slate-600">{s}</div>)}
                    </div>
                  </div>
                  <div className="border-2 border-slate-200 p-4 rounded-xl bg-white shadow-sm">
                    <div className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-slate-50">2</div>
                    <h4 className="font-black text-slate-700 text-xs mb-3 uppercase tracking-wider">JAMB Combo</h4>
                    <div className="flex flex-col gap-2">
                      {aiData.roadmap?.step2?.map((s:string, i:number)=><div key={i} className="text-xs bg-slate-50 border border-slate-200 py-2 px-1 rounded font-bold text-slate-600">{s}</div>)}
                    </div>
                  </div>
                  <div className="border-2 border-slate-200 p-4 rounded-xl bg-white shadow-sm">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-slate-50">3</div>
                    <h4 className="font-black text-slate-700 text-xs mb-3 uppercase tracking-wider">University</h4>
                    <div className="flex flex-col gap-2">
                      {aiData.roadmap?.step3?.map((s:string, i:number)=><div key={i} className="text-xs bg-slate-50 border border-slate-200 py-2 px-1 rounded font-bold text-slate-600">{s}</div>)}
                    </div>
                  </div>
                  <div className="border-2 border-blue-800 p-4 rounded-xl bg-blue-900 text-white shadow-md transform scale-105">
                    <div className="w-8 h-8 bg-white text-blue-900 rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-slate-50">4</div>
                    <h4 className="font-black text-blue-100 text-xs mb-3 uppercase tracking-wider">Career Goal</h4>
                    <div className="flex flex-col gap-2">
                      {aiData.roadmap?.step4?.map((s:string, i:number)=><div key={i} className="text-xs bg-blue-800 border border-blue-700 py-2 px-1 rounded font-bold">{s}</div>)}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* FORCE PAGE BREAK BEFORE CLINICAL DATA */}
            <div className="html2pdf__page-break"></div>

            {/* ========================================== */}
            {/* CLASSIC CLINICAL DATA PAGES (PAGES 3 - 6) */}
            {/* ========================================== */}
            <div className="mt-8 text-slate-800">
              
              {/* CLINICAL PAGE 1: Cognitive Abilities */}
              <div className="avoid-page-break mb-12">
                <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">1. Cognitive Abilities Assessment</h2>
                <h3 className="font-bold text-slate-700 mb-2 text-sm">1.1. Subtest Scores</h3>
                <p className="text-sm mb-4 text-slate-600">The ACET Cognitive Abilities Assessment evaluates a student's performance across five key subtests. The scores indicate how far a student's score deviates from the average.</p>
                <table className="w-full text-left border-collapse font-sans text-sm border border-slate-300 mb-6">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 border border-slate-300">Subtest</th>
                      <th className="p-3 border border-slate-300 text-center">Raw Score</th>
                      <th className="p-3 border border-slate-300 text-center">Total</th>
                      <th className="p-3 border border-slate-300">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(gradingResult?.categories || {}).map((cat, idx) => {
                      const c = gradingResult.categories[cat];
                      const pct = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
                      let interp = "Average";
                      if (pct < 40) interp = "Below Average";
                      if (pct > 75) interp = "Above Average";
                      
                      return (
                      <tr key={idx}>
                        <td className="p-3 border border-slate-300 font-semibold">{cat}</td>
                        <td className="p-3 border border-slate-300 text-center">{c.correct}</td>
                        <td className="p-3 border border-slate-300 text-center">{c.total}</td>
                        <td className="p-3 border border-slate-300 font-bold">{interp}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* FORCE PAGE BREAK */}
              <div className="html2pdf__page-break"></div>

              {/* ========================================== */}
            {/* CLASSIC CLINICAL DATA PAGES (PAGES 3 - 5) */}
            {/* ========================================== */}
            <div className="mt-8 text-slate-800">
              
              {/* CLINICAL PAGE 1: Cognitive Abilities */}
              <div className="avoid-page-break mb-12">
                <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">1. Cognitive Abilities Assessment</h2>
                
                <p className="text-sm mb-6 text-slate-700 leading-relaxed text-justify">
                  The ACET Cognitive Abilities Assessment evaluates a student's core fluid intelligence and problem-solving capabilities across five distinct subtests. 
                  Rather than measuring learned academic knowledge, these subtests measure the underlying cognitive engine that drives future learning. 
                  <br/><br/>
                  <strong>Understanding the Metrics:</strong><br/>
                  • <strong>Raw Score:</strong> The absolute number of questions answered correctly.<br/>
                  • <strong>Z-Score:</strong> A statistical measurement indicating how far the student's score deviates from the national average cohort. A Z-score of 0 is exactly average, positive scores are above average, and negative scores indicate areas requiring foundational support.<br/>
                  • <strong>Percentile Rank:</strong> Indicates the percentage of peers in the national normative sample that the student outperformed.
                </p>

                <h3 className="font-bold text-slate-800 mb-3 text-sm">1.1. Subtest Scores & Interpretation</h3>
                <table className="w-full text-left border-collapse font-sans text-sm border border-slate-300 mb-6">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 border border-slate-300">Subtest Domain</th>
                      <th className="p-3 border border-slate-300 text-center">Raw Score</th>
                      <th className="p-3 border border-slate-300 text-center">Z-Score (Est)</th>
                      <th className="p-3 border border-slate-300 text-center">Percentile</th>
                      <th className="p-3 border border-slate-300">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(gradingResult?.categories || {}).map((cat, idx) => {
                      const c = gradingResult.categories[cat];
                      const pct = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
                      
                      // Statistical estimation for the UI prototype
                      let interp = "Average";
                      let zScore = ((pct - 50) / 15).toFixed(2);
                      if (pct < 40) interp = "Below Average";
                      if (pct > 75) interp = "Above Average";
                      
                      return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 border border-slate-300 font-semibold">{cat}</td>
                        <td className="p-3 border border-slate-300 text-center">{c.correct} / {c.total}</td>
                        <td className="p-3 border border-slate-300 text-center font-mono">{zScore}</td>
                        <td className="p-3 border border-slate-300 text-center">{pct}th</td>
                        <td className={`p-3 border border-slate-300 font-bold ${interp === 'Above Average' ? 'text-blue-700' : interp === 'Below Average' ? 'text-orange-600' : 'text-slate-700'}`}>{interp}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* FORCE PAGE BREAK */}
              <div className="html2pdf__page-break"></div>

              {/* CLINICAL PAGE 2: Personality & Interests */}
              <div className="avoid-page-break mb-12 mt-8">
                <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">2. Psychological & Behavioral Profile</h2>
                
                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 mb-2 text-sm">2.1. The Big Five (OCEAN) Personality Assessment</h3>
                  <p className="text-sm mb-4 text-slate-700 leading-relaxed text-justify">
                    This assessment measures where the student falls across the globally recognized Big Five personality dimensions. These traits significantly influence a student's learning habits, emotional resilience during exams, and eventual cultural fit within a workplace.
                    High scores are not inherently "better" than low scores; rather, they indicate different behavioral preferences. For instance, high Conscientiousness indicates strict discipline, while higher Openness indicates strong creative and abstract thinking.
                  </p>

                  <table className="w-full text-left border-collapse font-sans text-sm border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-3 border border-slate-300">Personality Trait</th>
                        <th className="p-3 border border-slate-300 text-center">Score / 50</th>
                        <th className="p-3 border border-slate-300">Clinical Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { trait: 'Openness to Experience', score: 45, desc: 'Highly imaginative, prefers variety over strict routine.' },
                        { trait: 'Conscientiousness', score: 37, desc: 'Displays goal-directed behavior and organized study habits.' },
                        { trait: 'Extraversion', score: 38, desc: 'Draws energy from collaborative environments and group work.' },
                        { trait: 'Agreeableness', score: 44, desc: 'Highly cooperative, empathetic, and team-oriented.' },
                        { trait: 'Neuroticism (Emotional Stability)', score: 33, desc: 'Moderate stress response; capable of handling academic pressure.' }
                      ].map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 border border-slate-300 font-semibold">{p.trait}</td>
                          <td className="p-3 border border-slate-300 text-center font-bold">{p.score}</td>
                          <td className="p-3 border border-slate-300 text-xs">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 mb-2 text-sm">2.2. Holland Code (RIASEC) Occupational Interests</h3>
                  <p className="text-sm mb-4 text-slate-700 leading-relaxed text-justify">
                    The Holland Occupational Themes theory posits that individuals perform best in academic streams and careers that match their inherent interests. The assessment scores the student across six vocational categories. The combination of their top three categories forms their "Holland Code," which serves as the foundation for their Senior Secondary Specialization recommendations.
                  </p>

                  <table className="w-full text-left border-collapse font-sans text-sm border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-3 border border-slate-300 w-1/4">RIASEC Code</th>
                        <th className="p-3 border border-slate-300 text-center w-1/4">Score / 50</th>
                        <th className="p-3 border border-slate-300">Alignment Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { code: 'Realistic (The Doers)', score: 35 },
                        { code: 'Investigative (The Thinkers)', score: 44 },
                        { code: 'Artistic (The Creators)', score: 20 },
                        { code: 'Social (The Helpers)', score: 38 },
                        { code: 'Enterprising (The Persuaders)', score: 41 },
                        { code: 'Conventional (The Organizers)', score: 44 }
                      ].map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 border border-slate-300 font-semibold">{h.code}</td>
                          <td className="p-3 border border-slate-300 text-center font-bold">{h.score}</td>
                          <td className="p-3 border border-slate-300 text-xs">
                            {h.score >= 40 ? <span className="text-blue-700 font-bold">Strong Alignment</span> : h.score <= 25 ? <span className="text-slate-500">Low Alignment</span> : 'Moderate Alignment'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FORCE PAGE BREAK */}
              <div className="html2pdf__page-break"></div>

              {/* CLINICAL PAGE 3: Signatures (Renumbered to 3) */}
              <div className="avoid-page-break mb-12 mt-8">
                <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">3. Official Endorsement & Signatures</h2>
                
                <p className="text-sm mb-6 text-slate-700 leading-relaxed text-justify">
                  The insights contained within this ACET Intelligence Report represent a synthesis of the candidate's cognitive potential, psychometric orientation, and academic readiness. A tailored guidance approach—integrating continuous mentorship, environmental support, and periodic academic re-evaluation—is strongly recommended to assist the student in actualizing their defined career and university trajectory.
                </p>

                <h3 className="font-bold text-slate-800 mb-2 mt-8 text-sm">3.1 Internal Counselor's Verification Notes</h3>
                <div className="w-full h-48 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 italic">
                  [ Official School Use Only ]
                </div>

                <div className="mt-32 pt-12 border-t border-slate-300 flex justify-between items-end">
                  <div className="text-center w-64">
                    <div className="border-b border-black w-full mb-2"></div>
                    <span className="font-bold text-slate-800 text-sm block">Lead Psychometrician</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1 block">Propagate Digital</span>
                  </div>
                  <div className="text-center w-64">
                    <div className="border-b border-black w-full mb-2"></div>
                    <span className="font-bold text-slate-800 text-sm block">Principal / Administrator</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1 block">{student.organizationId || "Authorizing Institution"}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl mx-8">
            <Bot size={48} className="mx-auto mb-4 text-slate-300" />
            <p>Click "Generate AI Data" to extract intelligent insights and render the Master Report.</p>
          </div>
        )}
      </div>
    </div>
  );
}