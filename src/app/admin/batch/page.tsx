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
  const [schoolName, setSchoolName] = useState('Partner Institution Portal');
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
      
      const opt = {
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: `${student.name.replace(/\s+/g, '_')}_ACET_Report.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 715 }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
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
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '715px' }}>
        <div id="hidden-batch-render" style={{ width: '715px', minWidth: '715px', maxWidth: '715px', margin: '0 auto', backgroundColor: '#ffffff', boxSizing: 'border-box' }} className="text-slate-800 font-sans p-6">
          {renderStudent && renderStudent.aiReportData && (
             <div>
                {/* --- PAGE 1: REACT INFOGRAPHICS --- */}
                <div>
                  <header className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 mb-5">
                    <div>
                      <h1 className="text-2xl font-black text-blue-900 uppercase">ACET Intelligence Report</h1>
                      <p className="text-slate-600 flex items-center gap-2 mt-1 text-sm font-bold tracking-wide">
                        <User size={16} className="text-blue-600"/> {renderStudent.name} • {renderStudent.classLevel} • {renderStudent.organizationId || "Independent"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg font-bold text-xs border border-blue-100">
                        Date: {new Date(renderStudent.reportGeneratedAt || renderStudent.createdAt?.toDate()).toLocaleDateString()}
                      </div>
                    </div>
                  </header>

                  <section className="grid grid-cols-3 gap-5 mb-5">
                    <div className="col-span-2 bg-blue-900 p-6 rounded-3xl text-white shadow-sm flex flex-col justify-center relative overflow-hidden">
                      <div className="relative z-10">
                        <span className="bg-blue-800 text-blue-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-700">Primary Recommendation</span>
                        <h2 className="text-3xl font-black mt-3 mb-1 leading-tight">{renderStudent.aiReportData.recommendation || "Pending"}</h2>
                        <p className="text-blue-200 text-sm">Focus Area: {renderStudent.aiReportData.specialization || "Pending"}</p>
                      </div>
                      <Award className="absolute right-[-10px] bottom-[-10px] text-blue-800 opacity-50" size={150} />
                    </div>
                    
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-inner">
                      <h3 className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">Overall Accuracy</h3>
                      <div className="text-5xl font-black text-blue-600">{renderStudent.grading.percentage}%</div>
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-5 mb-5">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="text-blue-600" size={18}/>
                        <h3 className="text-base font-black text-slate-800">Cognitive Domains</h3>
                      </div>
                      <div className="space-y-3">
                        {['Logical', 'Numerical', 'Verbal', 'Abstract', 'Spatial'].map((domain) => {
                          const cat = renderStudent.grading.categories[`${domain} Reasoning`];
                          const score = cat && cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
                          if (!cat || cat.total === 0) return null; // Hides domains not administered

                          return (
                          <div key={domain} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700 uppercase tracking-wide">{domain}</span>
                              <span className={`font-black ${score > 60 ? 'text-blue-600' : 'text-slate-500'}`}>{score}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${score}%` }}></div>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>

                    <div className="bg-teal-900 p-6 rounded-3xl text-white shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="text-teal-300" size={18}/>
                        <h3 className="text-base font-black">AI Study Hacks</h3>
                      </div>
                      <p className="text-teal-100 mb-4 text-xs font-medium leading-relaxed">{renderStudent.aiReportData.studyHacks?.intro}</p>
                      <ul className="space-y-3">
                        {renderStudent.aiReportData.studyHacks?.bullets?.slice(0, 3).map((hack: any, i: number) => (
                          <li key={i} className="flex gap-2 items-start bg-teal-800 p-3 rounded-xl border border-teal-700">
                            <CheckCircle className="text-teal-300 shrink-0 mt-0.5" size={14} />
                            <div>
                              <h4 className="font-bold text-white text-xs">{hack.title}</h4>
                              <p className="text-teal-200 text-[10px] mt-1 leading-relaxed">{hack.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                </div>

                <div className="html2pdf__page-break"></div>

                {/* --- PAGE 2: ROADMAP & GAP --- */}
                <div className="mt-4">
                  <section className="grid grid-cols-2 gap-5 mb-5">
                    <div className="bg-orange-50 p-6 rounded-3xl border border-orange-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="text-orange-600" size={18}/>
                        <h3 className="text-base font-black text-orange-900">Skill Gap Analysis</h3>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                        <h4 className="font-black text-slate-800 mb-2 text-sm">{renderStudent.aiReportData.skillGap?.focus || "Identified Gap"}</h4>
                        <p className="text-slate-600 text-xs leading-relaxed font-medium">{renderStudent.aiReportData.skillGap?.description}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                       <div className="flex items-center gap-2 mb-4">
                        <User className="text-blue-600" size={18}/>
                        <h3 className="text-base font-black text-slate-800">Psychometrician's Notes</h3>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed italic border-l-2 border-blue-300 pl-3 font-medium">
                        "{renderStudent.aiReportData.counselorNotes}"
                      </p>
                    </div>
                  </section>

                  <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-5">
                    <div className="flex items-center gap-2 mb-6">
                      <Map className="text-blue-800" size={18}/>
                      <h3 className="text-base font-black text-blue-900">Academic to Career Roadmap</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="border border-slate-200 p-3 rounded-xl bg-white shadow-sm">
                        <div className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto -mt-6 mb-2 border-2 border-slate-50">1</div>
                        <h4 className="font-black text-slate-700 text-[10px] mb-2 uppercase tracking-wider">SS1 Subjects</h4>
                        <div className="flex flex-col gap-1.5">
                          {renderStudent.aiReportData.roadmap?.step1?.map((s:string, i:number)=><div key={i} className="text-[10px] bg-slate-50 border border-slate-200 py-1.5 px-1 rounded font-bold text-slate-600">{s}</div>)}
                        </div>
                      </div>
                      <div className="border border-slate-200 p-3 rounded-xl bg-white shadow-sm">
                        <div className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto -mt-6 mb-2 border-2 border-slate-50">2</div>
                        <h4 className="font-black text-slate-700 text-[10px] mb-2 uppercase tracking-wider">JAMB Combo</h4>
                        <div className="flex flex-col gap-1.5">
                          {renderStudent.aiReportData.roadmap?.step2?.map((s:string, i:number)=><div key={i} className="text-[10px] bg-slate-50 border border-slate-200 py-1.5 px-1 rounded font-bold text-slate-600">{s}</div>)}
                        </div>
                      </div>
                      <div className="border border-slate-200 p-3 rounded-xl bg-white shadow-sm">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto -mt-6 mb-2 border-2 border-slate-50">3</div>
                        <h4 className="font-black text-slate-700 text-[10px] mb-2 uppercase tracking-wider">University</h4>
                        <div className="flex flex-col gap-1.5">
                          {renderStudent.aiReportData.roadmap?.step3?.map((s:string, i:number)=><div key={i} className="text-[10px] bg-slate-50 border border-slate-200 py-1.5 px-1 rounded font-bold text-slate-600">{s}</div>)}
                        </div>
                      </div>
                      <div className="border border-blue-800 p-3 rounded-xl bg-blue-900 text-white shadow-sm">
                        <div className="w-6 h-6 bg-white text-blue-900 rounded-full flex items-center justify-center text-xs font-bold mx-auto -mt-6 mb-2 border-2 border-slate-50">4</div>
                        <h4 className="font-black text-blue-100 text-[10px] mb-2 uppercase tracking-wider">Career Goal</h4>
                        <div className="flex flex-col gap-1.5">
                          {renderStudent.aiReportData.roadmap?.step4?.map((s:string, i:number)=><div key={i} className="text-[10px] bg-blue-800 border border-blue-700 py-1.5 px-1 rounded font-bold">{s}</div>)}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="html2pdf__page-break"></div>

                {/* --- PAGE 3: CLINICAL DATA --- */}
                <div className="mt-4 text-slate-800">
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-blue-900 mb-3 border-b-2 border-blue-900 pb-1">1. Cognitive Abilities Assessment</h2>
                    <p className="text-xs mb-4 text-slate-700 leading-relaxed text-justify">
                      The ACET Cognitive Abilities Assessment evaluates a student's core fluid intelligence and problem-solving capabilities across five distinct subtests. 
                      Rather than measuring learned academic knowledge, these subtests measure the underlying cognitive engine that drives future learning. 
                      <br/><br/>
                      <strong>Understanding the Metrics:</strong><br/>
                      • <strong>Raw Score:</strong> The absolute number of questions answered correctly.<br/>
                      • <strong>Z-Score:</strong> A statistical measurement indicating how far the student's score deviates from the <strong>Cohort Average</strong>.<br/>
                      • <strong>Percentile Rank:</strong> Indicates the percentage of peers in the cohort sample that the student outperformed.
                    </p>

                    <h3 className="font-bold text-slate-800 mb-2 text-xs">1.1. Subtest Scores & Interpretation</h3>
                    <table className="w-full text-left border-collapse font-sans text-xs border border-slate-300 mb-6">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 border border-slate-300">Subtest Domain</th>
                          <th className="p-2 border border-slate-300 text-center">Raw Score</th>
                          <th className="p-2 border border-slate-300 text-center">Z-Score (Est)</th>
                          <th className="p-2 border border-slate-300 text-center">Percentile</th>
                          <th className="p-2 border border-slate-300">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 🚨 THE 0/0 REMOVAL: Entirely hides domains with 0 questions */}
                        {['Logical', 'Numerical', 'Verbal', 'Abstract', 'Spatial'].map((domain, idx) => {
                          const catName = `${domain} Reasoning`;
                          const c = renderStudent.grading.categories[catName];
                          const total = c?.total || 0;
                          const correct = c?.correct || 0;
                          
                          if (total === 0) return null; // 🚨 THIS REMOVES THE 0/0 ROWS

                          const pct = Math.round((correct / total) * 100);
                          let interp = "Average";
                          let zScore = ((pct - 50) / 15).toFixed(2);
                          if (pct < 40) interp = "Below Average";
                          if (pct > 75) interp = "Above Average";
                          
                          return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2 border border-slate-300 font-semibold">{catName}</td>
                            <td className="p-2 border border-slate-300 text-center">{correct} / {total}</td>
                            <td className="p-2 border border-slate-300 text-center font-mono">{zScore}</td>
                            <td className="p-2 border border-slate-300 text-center">{pct}th</td>
                            <td className={`p-2 border border-slate-300 font-bold ${interp === 'Above Average' ? 'text-blue-700' : interp === 'Below Average' ? 'text-orange-600' : 'text-slate-700'}`}>{interp}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>

                  <div className="html2pdf__page-break"></div>

                  <div className="mt-4">
                    <h2 className="text-lg font-bold text-blue-900 mb-3 border-b-2 border-blue-900 pb-1">2. Psychological & Behavioral Profile</h2>
                    <div className="mb-6">
                      <h3 className="font-bold text-slate-800 mb-2 text-xs">2.1. The Big Five (OCEAN) Personality Assessment</h3>
                      <table className="w-full text-left border-collapse font-sans text-xs border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="p-2 border border-slate-300">Personality Trait</th>
                            <th className="p-2 border border-slate-300 text-center">Score / 50</th>
                            <th className="p-2 border border-slate-300">Clinical Interpretation</th>
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
                              <td className="p-2 border border-slate-300 font-semibold">{p.trait}</td>
                              <td className="p-2 border border-slate-300 text-center font-bold">{p.score}</td>
                              <td className="p-2 border border-slate-300 text-[10px]">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-slate-800 mb-2 text-xs">2.2. Holland Code (RIASEC) Occupational Interests</h3>
                      <table className="w-full text-left border-collapse font-sans text-xs border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="p-2 border border-slate-300 w-1/4">RIASEC Code</th>
                            <th className="p-2 border border-slate-300 text-center w-1/4">Score / 50</th>
                            <th className="p-2 border border-slate-300">Alignment Description</th>
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
                              <td className="p-2 border border-slate-300 font-semibold">{h.code}</td>
                              <td className="p-2 border border-slate-300 text-center font-bold">{h.score}</td>
                              <td className="p-2 border border-slate-300 text-[10px]">
                                {h.score >= 40 ? <span className="text-blue-700 font-bold">Strong Alignment</span> : h.score <= 25 ? <span className="text-slate-500">Low Alignment</span> : 'Moderate Alignment'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="html2pdf__page-break"></div>

                  <div className="mt-4">
                    <h2 className="text-lg font-bold text-blue-900 mb-3 border-b-2 border-blue-900 pb-1">3. Integrated Summary and Recommendations</h2>
                    
                    <h3 className="font-bold text-slate-800 mb-1 mt-3 text-xs">3.1. Summary of Key Findings</h3>
                    <p className="text-xs mb-4 text-slate-700 leading-relaxed text-justify">
                      {renderStudent.name} demonstrates strengths aligned with their recommended trajectory. As noted by our psychometric analysis: <i>"{renderStudent.aiReportData.counselorNotes}"</i>
                    </p>

                    <h3 className="font-bold text-slate-800 mb-1 mt-4 text-xs">3.2. Senior Secondary Specialization Recommendations</h3>
                    <ul className="list-disc pl-4 text-xs text-slate-700 mb-4 space-y-1">
                      <li><strong>Primary Specialization:</strong> {renderStudent.aiReportData.recommendation}</li>
                      <li><strong>Secondary Specialization:</strong> {renderStudent.aiReportData.specialization}</li>
                    </ul>

                    <h3 className="font-bold text-slate-800 mb-1 mt-4 text-xs">3.3. Potential Career Paths</h3>
                    <p className="text-xs font-bold text-blue-800 mb-8">
                      {renderStudent.aiReportData.roadmap?.step4?.join(', ')}
                    </p>

                    <div className="border-t border-slate-300 my-6"></div>

                    <h2 className="text-lg font-bold text-blue-900 mb-3 pb-1">4. Official Endorsement & Signatures</h2>
                    <p className="text-xs mb-6 text-slate-700 leading-relaxed text-justify">
                      The insights contained within this ACET Intelligence Report represent a synthesis of the candidate's cognitive potential, psychometric orientation, and academic readiness. A tailored guidance approach—integrating continuous mentorship, environmental support, and periodic academic re-evaluation—is strongly recommended.
                    </p>

                    <div className="mt-16 flex justify-end items-end">
                      <div className="text-center w-64">
                        <div className="border-b border-black w-full mb-2"></div>
                        <span className="font-bold text-slate-800 text-xs block">Principal / Administrator</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 block">{renderStudent.organizationId || "Authorizing Institution"}</span>
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