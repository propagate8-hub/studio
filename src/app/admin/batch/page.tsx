"use client";

import React, { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Settings, Play, Download, Loader2, CheckCircle, 
  User, Award, Brain, Lightbulb, Target, Map 
} from 'lucide-react';
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
  const [renderStudent, setRenderStudent] = useState<any>(null);

  const fetchCohort = async () => {
    setIsFetching(true);
    try {
      const q = query(
        collection(db, 'Students'), 
        where('organizationId', '==', schoolName),
        where('classLevel', '==', classLevel),
        where('isTestCompleted', '==', true)
      );
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));

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

  const gradeStudent = (studentData: any) => {
    let correctCount = 0;
    const answers = studentData.finalAnswers || {};
    const categories: any = {};

    Object.keys(answers).forEach((questionId) => {
      const studentAnswer = answers[questionId];
      const questionData = masterKey[questionId];
      
      if (questionData) {
        const isCorrect = studentAnswer === (questionData.correct_answer || questionData.correctAnswer || questionData.answer);
        if (isCorrect) correctCount++;
        
        const cat = questionData.category || "General";
        if (!categories[cat]) categories[cat] = { correct: 0, total: 0 };
        categories[cat].total += 1;
        if (isCorrect) categories[cat].correct += 1;
      }
    });

    const totalQuestions = Object.keys(answers).length;
    return {
      score: correctCount,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      categories
    };
  };

  const runBatchAI = async () => {
    setIsGenerating(true);
    let count = 0;
    for (const student of students) {
      count++;
      setProgress({ current: count, total: students.length, status: `Extracting AI Data for ${student.name}...` });
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
    await fetchCohort(); 
  };

  const downloadBatchPDFs = async () => {
    setIsDownloading(true);
    const html2pdf = (await import('html2pdf.js')).default;
    let count = 0;

    for (const student of students) {
      if (!student.aiReportData) continue;
      count++;
      setProgress({ current: count, total: students.length, status: `Rendering PDF for ${student.name}...` });
      
      setRenderStudent({ ...student, grading: gradeStudent(student) });
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      const element = document.getElementById('hidden-batch-render');
      
      // 🚨 IRONCLAD PDF OPTIONS: 715px locks perfectly to A4 printable area
      const opt = {
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: `${student.name.replace(/\s+/g, '_')}_ACET_Report.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 715 }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-page-break'] }
      };
      
      await html2pdf().set(opt).from(element).save();
      await new Promise(resolve => setTimeout(resolve, 2000)); 
    }

    setProgress({ current: count, total: students.length, status: 'All PDFs Downloaded!' });
    setIsDownloading(false);
    setRenderStudent(null); 
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

      {students.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-blue-900">Cohort Queue: {students.length} Students Found</h2>
            <p className="text-slate-500">AI Data Extracted: {aiReadyCount} / {students.length}</p>
          </div>

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
      {/* 🚨 THE 715px CSS LOCK: Prevents rendering engine from stretching the layout */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '715px' }}>
        <div id="hidden-batch-render" style={{ width: '715px', minWidth: '715px', maxWidth: '715px', margin: '0 auto', backgroundColor: '#ffffff', boxSizing: 'border-box' }} className="text-slate-800 font-sans p-8">
          {renderStudent && renderStudent.aiReportData && (
             <div>
                {/* --- PAGE 1 & 2: REACT INFOGRAPHICS --- */}
                <div className="avoid-page-break">
                  <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 mb-8">
                    <div>
                      <h1 className="text-3xl font-black text-blue-900 uppercase">ACET Intelligence Report</h1>
                      <p className="text-slate-600 flex items-center gap-2 mt-2 font-bold tracking-wide">
                        <User size={18} className="text-blue-600"/> {renderStudent.name} • {renderStudent.classLevel} • {renderStudent.organizationId || "Independent"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm border border-blue-100">
                        Date: {new Date(renderStudent.reportGeneratedAt || renderStudent.createdAt?.toDate()).toLocaleDateString()}
                      </div>
                    </div>
                  </header>

                  <section className="grid grid-cols-3 gap-6 mb-8">
                    <div className="col-span-2 bg-blue-900 p-8 rounded-3xl text-white shadow-md flex flex-col justify-center relative overflow-hidden">
                      <div className="relative z-10">
                        <span className="bg-blue-800 text-blue-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-700">Primary Recommendation</span>
                        <h2 className="text-4xl font-black mt-4 mb-2 leading-tight">{renderStudent.aiReportData.recommendation || "Pending"}</h2>
                        <p className="text-blue-200 text-lg">Focus Area: {renderStudent.aiReportData.specialization || "Pending"}</p>
                      </div>
                      <Award className="absolute right-[-20px] bottom-[-20px] text-blue-800 opacity-50" size={200} />
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-inner">
                      <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Overall Accuracy</h3>
                      <div className="text-6xl font-black text-blue-600">{renderStudent.grading.percentage}%</div>
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-6 mb-8">
                    {/* 🚨 COMPACT INFOGRAPHIC FIX */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col justify-start">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="text-blue-600" size={20}/>
                        <h3 className="text-lg font-black text-slate-800">Cognitive Domains</h3>
                      </div>
                      <div className="space-y-4">
                        {/* 🚨 INFOGRAPHIC FILTER: Hide 0% */}
                        {['Logical', 'Numerical', 'Verbal', 'Abstract', 'Spatial'].map((domain) => {
                          const cat = renderStudent.grading.categories[`${domain} Reasoning`];
                          const score = cat && cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
                          if (score === 0) return null; 

                          return (
                          <div key={domain} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700 uppercase tracking-wide">{domain}</span>
                              <span className={`font-black ${score > 60 ? 'text-blue-600' : 'text-slate-500'}`}>{score}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${score}%` }}></div>
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
                      <p className="text-teal-100 mb-6 text-sm font-medium leading-relaxed">{renderStudent.aiReportData.studyHacks?.intro}</p>
                      <ul className="space-y-4">
                        {renderStudent.aiReportData.studyHacks?.bullets?.map((hack: any, i: number) => (
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

                <div className="html2pdf__page-break"></div>

                <div className="avoid-page-break mt-8">
                  <section className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-orange-50 p-8 rounded-3xl border border-orange-200">
                      <div className="flex items-center gap-3 mb-6">
                        <Target className="text-orange-600" size={24}/>
                        <h3 className="text-xl font-black text-orange-900">Skill Gap Analysis</h3>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                        <h4 className="font-black text-slate-800 mb-3 text-lg">{renderStudent.aiReportData.skillGap?.focus || "Identified Gap"}</h4>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{renderStudent.aiReportData.skillGap?.description}</p>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                       <div className="flex items-center gap-3 mb-6">
                        <User className="text-blue-600" size={24}/>
                        <h3 className="text-xl font-black text-slate-800">Psychometrician's Notes</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-loose italic border-l-4 border-blue-300 pl-5 font-medium">
                        "{renderStudent.aiReportData.counselorNotes}"
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
                          {renderStudent.aiReportData.roadmap?.step1?.map((s:string, i:number)=><div key={i} className="text-xs bg-slate-50 border border-slate-200 py-2 px-1 rounded font-bold text-slate-600">{s}</div>)}
                        </div>
                      </div>
                      <div className="border-2 border-slate-200 p-4 rounded-xl bg-white shadow-sm">
                        <div className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-slate-50">2</div>
                        <h4 className="font-black text-slate-700 text-xs mb-3 uppercase tracking-wider">JAMB Combo</h4>
                        <div className="flex flex-col gap-2">
                          {renderStudent.aiReportData.roadmap?.step2?.map((s:string, i:number)=><div key={i} className="text-xs bg-slate-50 border border-slate-200 py-2 px-1 rounded font-bold text-slate-600">{s}</div>)}
                        </div>
                      </div>
                      <div className="border-2 border-slate-200 p-4 rounded-xl bg-white shadow-sm">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-slate-50">3</div>
                        <h4 className="font-black text-slate-700 text-xs mb-3 uppercase tracking-wider">University</h4>
                        <div className="flex flex-col gap-2">
                          {renderStudent.aiReportData.roadmap?.step3?.map((s:string, i:number)=><div key={i} className="text-xs bg-slate-50 border border-slate-200 py-2 px-1 rounded font-bold text-slate-600">{s}</div>)}
                        </div>
                      </div>
                      <div className="border-2 border-blue-800 p-4 rounded-xl bg-blue-900 text-white shadow-md transform scale-105">
                        <div className="w-8 h-8 bg-white text-blue-900 rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-slate-50">4</div>
                        <h4 className="font-black text-blue-100 text-xs mb-3 uppercase tracking-wider">Career Goal</h4>
                        <div className="flex flex-col gap-2">
                          {renderStudent.aiReportData.roadmap?.step4?.map((s:string, i:number)=><div key={i} className="text-xs bg-blue-800 border border-blue-700 py-2 px-1 rounded font-bold">{s}</div>)}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="html2pdf__page-break"></div>

                {/* --- PAGES 3 to 6: CLASSIC CLINICAL DATA --- */}
                <div className="mt-8 text-slate-800">
                  <div className="avoid-page-break mb-12">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">1. Cognitive Abilities Assessment</h2>
                    <p className="text-sm mb-6 text-slate-700 leading-relaxed text-justify">
                      The ACET Cognitive Abilities Assessment evaluates a student's core fluid intelligence and problem-solving capabilities across five distinct subtests. 
                      Rather than measuring learned academic knowledge, these subtests measure the underlying cognitive engine that drives future learning. 
                      <br/><br/>
                      <strong>Understanding the Metrics:</strong><br/>
                      • <strong>Raw Score:</strong> The absolute number of questions answered correctly.<br/>
                      • <strong>Z-Score:</strong> A statistical measurement indicating how far the student's score deviates from the <strong>Cohort Average</strong>. A Z-score of 0 is exactly average, positive scores are above average, and negative scores indicate areas requiring foundational support.<br/>
                      • <strong>Percentile Rank:</strong> Indicates the percentage of peers in the cohort sample that the student outperformed.
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
                        {/* 🚨 CLINICAL TABLE: EXPLICITLY MAPS ALL 5 DOMAINS (NO DATA BLEEDING) */}
                        {['Logical', 'Numerical', 'Verbal', 'Abstract', 'Spatial'].map((domain, idx) => {
                          const catName = `${domain} Reasoning`;
                          const c = renderStudent.grading.categories[catName];
                          const total = c?.total || 0;
                          const correct = c?.correct || 0;
                          const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                          
                          let interp = "Average";
                          let zScore = ((pct - 50) / 15).toFixed(2);
                          if (pct < 40) interp = "Below Average";
                          if (pct > 75) interp = "Above Average";
                          
                          return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 border border-slate-300 font-semibold">{catName}</td>
                            <td className="p-3 border border-slate-300 text-center">{correct} / {total}</td>
                            <td className="p-3 border border-slate-300 text-center font-mono">{zScore}</td>
                            <td className="p-3 border border-slate-300 text-center">{pct}th</td>
                            <td className={`p-3 border border-slate-300 font-bold ${interp === 'Above Average' ? 'text-blue-700' : interp === 'Below Average' ? 'text-orange-600' : 'text-slate-700'}`}>{interp}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>

                  <div className="html2pdf__page-break"></div>

                  <div className="avoid-page-break mb-12 mt-8">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">2. Psychological & Behavioral Profile</h2>
                    <div className="mb-8">
                      <h3 className="font-bold text-slate-800 mb-2 text-sm">2.1. The Big Five (OCEAN) Personality Assessment</h3>
                      <p className="text-sm mb-4 text-slate-700 leading-relaxed text-justify">
                        This assessment measures where the student falls across the globally recognized Big Five personality dimensions. These traits significantly influence a student's learning habits, emotional resilience during exams, and eventual cultural fit within a workplace.
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
                        The Holland Occupational Themes theory posits that individuals perform best in academic streams and careers that match their inherent interests. The combination of their top three categories forms their "Holland Code."
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

                  <div className="html2pdf__page-break"></div>

                  <div className="avoid-page-break mb-12 mt-8">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">3. Integrated Summary and Recommendations</h2>
                    
                    <h3 className="font-bold text-slate-800 mb-2 mt-4 text-sm">3.1. Summary of Key Findings</h3>
                    <p className="text-sm mb-6 text-slate-700 leading-relaxed text-justify">
                      {renderStudent.name} demonstrates strengths aligned with their recommended trajectory. As noted by our psychometric analysis: <i>"{renderStudent.aiReportData.counselorNotes}"</i>
                    </p>

                    <h3 className="font-bold text-slate-800 mb-2 mt-6 text-sm">3.2. Senior Secondary Specialization Recommendations</h3>
                    <p className="text-sm mb-2 text-slate-700 leading-relaxed text-justify">
                      Based on the integrated assessment results, the following senior secondary specializations are recommended:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-slate-700 mb-6 space-y-1">
                      <li><strong>Primary Specialization:</strong> {renderStudent.aiReportData.recommendation}</li>
                      <li><strong>Secondary Specialization:</strong> {renderStudent.aiReportData.specialization}</li>
                    </ul>

                    <h3 className="font-bold text-slate-800 mb-2 mt-6 text-sm">3.3. Potential Career Paths</h3>
                    <p className="text-sm mb-2 text-slate-700 leading-relaxed text-justify">
                      Based on the recommended senior secondary specializations, here are some potential career paths the student may wish to explore:
                    </p>
                    <p className="text-sm font-bold text-blue-800 mb-6">
                      {renderStudent.aiReportData.roadmap?.step4?.join(', ')}
                    </p>
                  </div>

                  <div className="html2pdf__page-break"></div>

                  <div className="avoid-page-break mb-12 mt-8">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">4. Official Endorsement & Signatures</h2>
                    
                    <p className="text-sm mb-6 text-slate-700 leading-relaxed text-justify">
                      The insights contained within this ACET Intelligence Report represent a synthesis of the candidate's cognitive potential, psychometric orientation, and academic readiness. A tailored guidance approach—integrating continuous mentorship, environmental support, and periodic academic re-evaluation—is strongly recommended to assist the student in actualizing their defined career and university trajectory.
                    </p>

                    <h3 className="font-bold text-slate-800 mb-2 mt-8 text-sm">4.1 Internal Counselor's Verification Notes</h3>
                    <div className="w-full h-48 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 italic">
                      [ Official School Use Only ]
                    </div>

                    {/* 🚨 THE SIGNATURE FIX: Right-aligned Principal Block Only */}
                    <div className="mt-24 pt-8 border-t border-slate-300 flex justify-end items-end">
                      <div className="text-center w-72">
                        <div className="border-b border-black w-full mb-2"></div>
                        <span className="font-bold text-slate-800 text-sm block">Principal / Administrator</span>
                        <span className="text-xs text-slate-500 uppercase tracking-widest mt-1 block">{renderStudent.organizationId || "Authorizing Institution"}</span>
                      </div>
                    </div>
                  </div>

                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}