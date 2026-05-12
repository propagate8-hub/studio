"use client";

import React, { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Settings, Play, Download, Loader2, CheckCircle, 
  User, Award, Brain, Lightbulb, Target, Map 
} from 'lucide-react';
import Link from 'next/link';

// 🛠️ THE DATE FIX
const formatSafeDate = (timestamp: any) => {
  if (!timestamp) return "Pending";
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toLocaleDateString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString();
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? "Pending" : d.toLocaleDateString();
};

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
    let assessableQuestions = 0;
    
    const answers = studentData.finalAnswers || {};
    const categories: any = {};

    // 1. GRADE COGNITIVE QUESTIONS
    Object.keys(answers).forEach((questionId) => {
      const studentAnswer = answers[questionId];
      const questionData = masterKey[questionId];
      
      if (questionData) {
        if (questionData.correct_answer || questionData.correctAnswer) {
          assessableQuestions++;
          const isCorrect = studentAnswer === (questionData.correct_answer || questionData.correctAnswer);
          if (isCorrect) correctCount++;
        }
        
        const cat = questionData.category || "General";
        if (!categories[cat]) categories[cat] = { correct: 0, total: 0 };
        categories[cat].total += 1;
        
        if (questionData.correct_answer || questionData.correctAnswer) {
           const isCorrect = studentAnswer === (questionData.correct_answer || questionData.correctAnswer);
           if (isCorrect) categories[cat].correct += 1;
        }
      }
    });

    // 2. THE ADAPTIVE PSYCHOMETRIC CALCULATOR
    // We now track the 'count' of how many questions were actually served!
    const oceanScores: Record<string, any> = {
      OPE: { trait: 'Openness to Experience', score: 0, count: 0 },
      CON: { trait: 'Conscientiousness', score: 0, count: 0 },
      EXT: { trait: 'Extraversion', score: 0, count: 0 },
      AGR: { trait: 'Agreeableness', score: 0, count: 0 },
      NEU: { trait: 'Neuroticism (Emotional Stability)', score: 0, count: 0 }
    };

    const riasecScores: Record<string, any> = {
      REA: { code: 'Realistic (The Doers)', score: 0, count: 0 },
      INV: { code: 'Investigative (The Thinkers)', score: 0, count: 0 },
      ART: { code: 'Artistic (The Creators)', score: 0, count: 0 },
      SOC: { code: 'Social (The Helpers)', score: 0, count: 0 },
      ENT: { code: 'Enterprising (The Persuaders)', score: 0, count: 0 },
      CON: { code: 'Conventional (The Organizers)', score: 0, count: 0 }
    };

    const traverseDeepSearch = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const upperKey = key.toUpperCase();
        const val = obj[key];
        
        let num = 0;
        const parseValue = (v: any) => {
          if (typeof v === 'number') return v;
          if (typeof v === 'string') {
            const lower = v.toLowerCase().trim();
            if (lower === 'a') return 5;
            if (lower === 'b') return 4;
            if (lower === 'c') return 3;
            if (lower === 'd') return 2;
            if (lower === 'e') return 1;
            if (lower === '5') return 5;
            if (lower === '4') return 4;
            if (lower === '3') return 3;
            if (lower === '2') return 2;
            if (lower === '1') return 1;
            if (lower.includes('strongly agree') || lower.includes('very interested')) return 5;
            if (lower.includes('strongly disagree') || lower.includes('not at all')) return 1;
            if (lower.includes('agree') || lower.includes('interested')) return 4;
            if (lower.includes('disagree')) return 2;
            if (lower.includes('neutral') || lower.includes('not sure')) return 3;
            return parseInt(lower, 10) || 0;
          }
          return 0;
        };

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          num = parseValue(val.answer || val.value || val.score || val.selectedOption || val.response || val.text);
        } else {
          num = parseValue(val);
        }

        // Tally scores AND increment the count of questions served
        if (upperKey.startsWith('PER_')) {
          if (upperKey.includes('OPE')) { oceanScores['OPE'].score += num; oceanScores['OPE'].count++; }
          else if (upperKey.includes('CON')) { oceanScores['CON'].score += num; oceanScores['CON'].count++; }
          else if (upperKey.includes('EXT') || upperKey.includes('EXV')) { oceanScores['EXT'].score += num; oceanScores['EXT'].count++; }
          else if (upperKey.includes('AGR')) { oceanScores['AGR'].score += num; oceanScores['AGR'].count++; }
          else if (upperKey.includes('NEU') || upperKey.includes('EMO')) { oceanScores['NEU'].score += num; oceanScores['NEU'].count++; }
        } else if (upperKey.startsWith('INT_')) {
          if (upperKey.includes('REA')) { riasecScores['REA'].score += num; riasecScores['REA'].count++; }
          else if (upperKey.includes('INV')) { riasecScores['INV'].score += num; riasecScores['INV'].count++; }
          else if (upperKey.includes('ART')) { riasecScores['ART'].score += num; riasecScores['ART'].count++; }
          else if (upperKey.includes('SOC')) { riasecScores['SOC'].score += num; riasecScores['SOC'].count++; }
          else if (upperKey.includes('ENT')) { riasecScores['ENT'].score += num; riasecScores['ENT'].count++; }
          else if (upperKey.includes('CON') && !upperKey.includes('PER_')) { riasecScores['CON'].score += num; riasecScores['CON'].count++; }
        } 
        
        if (typeof val === 'object' && val !== null) {
           traverseDeepSearch(val);
        }
      });
    };

    traverseDeepSearch({ ...studentData, ...(studentData.finalAnswers || {}) });

    // ADAPTIVE SCALING MATH FOR OCEAN
    Object.values(oceanScores).forEach(t => {
       if (t.count === 0) {
         t.displayScore = "N/A";
         t.interpretation = "Not Assessed (Adaptive Skip)";
         return;
       }
       // Scale raw score up to a base of 50
       const maxPossible = t.count * 5;
       const scaledScore = Math.round((t.score / maxPossible) * 50);
       t.displayScore = scaledScore;

       if (scaledScore >= 35) t.interpretation = "Strongly expressed trait; drives key learning behaviors.";
       else if (scaledScore <= 25) t.interpretation = "Lower expression; typically acts contextually.";
       else t.interpretation = "Moderate expression; adaptable depending on environment.";
    });

    // ADAPTIVE SCALING MATH FOR RIASEC
    Object.values(riasecScores).forEach(h => {
       if (h.count === 0) {
         h.displayScore = "N/A";
         h.interpretation = "Not Assessed (Adaptive Skip)";
         return;
       }
       const maxPossible = h.count * 5;
       const scaledScore = Math.round((h.score / maxPossible) * 50);
       h.displayScore = scaledScore;
    });

    return {
      score: correctCount,
      total: assessableQuestions,
      percentage: assessableQuestions > 0 ? Math.round((correctCount / assessableQuestions) * 100) : 0,
      categories,
      ocean: Object.values(oceanScores),   
      holland: Object.values(riasecScores) 
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
    let count = 0;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      for (const student of students) {
        if (!student.aiReportData) continue;
        count++;
        setProgress({ current: count, total: students.length, status: `Rendering PDF for ${student.name || 'Student'}...` });
        
        setRenderStudent({ ...student, grading: gradeStudent(student) });
        
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        
        const element = document.getElementById('hidden-batch-render');
        if (!element) continue;
        
        const safeName = student.name ? student.name.replace(/\s+/g, '_') : 'Student';
        
        const opt = {
          margin: 0.4,
          filename: `${safeName}_ACET_Report.pdf`,
          image: { type: 'jpeg' as const, quality: 1 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 715 }, 
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-page-break'] }
        };
        
        await html2pdf().set(opt).from(element).save();
        await new Promise(resolve => setTimeout(resolve, 2000)); 
      }
      setProgress({ current: count, total: students.length, status: 'All PDFs Downloaded!' });
    } catch (error) {
      console.error("PDF generation crashed:", error);
      setProgress({ current: count, total: students.length, status: 'Error generating PDFs!' });
    }

    setIsDownloading(false);
    setRenderStudent(null); 
  };

  const downloadSummaryCSV = () => {
    let csvContent = "Student Name,Class Level,Overall Accuracy (%),Primary Recommendation,Focus Area\n";
    students.forEach(student => {
      if (student.aiReportData) {
        const grading = gradeStudent(student); 
        const name = `"${student.name || 'Unknown'}"`;
        const classLevel = `"${student.classLevel || 'Unknown'}"`;
        const accuracy = grading.percentage;
        const rec = `"${student.aiReportData.recommendation || student.aiReportData.recommendations?.primary || 'Pending'}"`;
        const spec = `"${student.aiReportData.specialization || student.aiReportData.recommendations?.secondary || 'Pending'}"`;
        csvContent += `${name},${classLevel},${accuracy},${rec},${spec}\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${schoolName.replace(/\s+/g, '_')}_Summary_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            
            <button 
              onClick={downloadSummaryCSV} 
              disabled={aiReadyCount === 0}
              className={`p-6 rounded-xl font-black text-lg flex flex-col items-center justify-center gap-1 transition-all ${aiReadyCount === 0 ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
            >
              <div className="flex items-center gap-2"><Target size={20}/> Step 3: CSV Summary</div>
              <span className="text-xs font-medium opacity-80">Export Bird's Eye View</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BULLETPROOF HIDDEN DOM FOR PDF RENDERING   */}
      {/* ========================================== */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '715px' }}>
        {renderStudent && renderStudent.aiReportData && (
          <div id="hidden-batch-render" style={{ width: '715px', minWidth: '715px', maxWidth: '715px', margin: '0 auto', backgroundColor: '#ffffff', boxSizing: 'border-box' }} className="text-slate-800 font-sans p-8">
             <div>
                {/* --- PAGE 1: REACT INFOGRAPHICS --- */}
                <div>
                  <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-blue-900 uppercase">ACET Intelligence Report</h1>
                      <p className="text-slate-600 flex items-center gap-2 mt-2 font-bold tracking-wide">
                        <User size={18} className="text-blue-600"/> {renderStudent.name || "Student"} • {renderStudent.classLevel || "JSS 3"} • {renderStudent.organizationId || "Independent"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm border border-blue-100">
                        Date: {formatSafeDate(renderStudent.reportGeneratedAt || renderStudent.createdAt)}
                      </div>
                    </div>
                  </header>

                  <section className="grid grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2 bg-blue-900 p-8 rounded-3xl text-white shadow-md flex flex-col justify-center relative overflow-hidden">
                      <div className="relative z-10">
                        <span className="bg-blue-800 text-blue-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-700">Primary Recommendation</span>
                        <h2 className="text-3xl font-black mt-4 mb-2 leading-tight">{renderStudent.aiReportData.recommendation || renderStudent.aiReportData.recommendations?.primary || "Pending"}</h2>
                        <p className="text-blue-200 text-lg">Focus Area: {renderStudent.aiReportData.specialization || renderStudent.aiReportData.recommendations?.secondary || "Pending"}</p>
                      </div>
                      <Award className="absolute right-[-20px] bottom-[-20px] text-blue-800 opacity-50" size={200} />
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-inner">
                      <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Overall Accuracy</h3>
                      <div className="text-6xl font-black text-blue-600">{renderStudent.grading?.percentage || 0}%</div>
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col justify-start">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="text-blue-600" size={20}/>
                        <h3 className="text-lg font-black text-slate-800">Cognitive Domains</h3>
                      </div>
                      <div className="space-y-4">
                        {['Verbal Reasoning', 'Numerical Reasoning', 'Abstract/Logical Reasoning', 'Spatial & Mechanical Reasoning'].map((catName) => {
                          const cat = renderStudent.grading?.categories?.[catName];
                          if (!cat || cat.total === 0) return null; 
                          const score = Math.round((cat.correct / cat.total) * 100);
                          return (
                          <div key={catName} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700 uppercase tracking-wide">{catName.replace(' Reasoning', '')}</span>
                              <span className={`font-black ${score > 60 ? 'text-blue-600' : 'text-slate-500'}`}>{score}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${score}%` }}></div>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>

                    <div className="bg-teal-900 p-6 rounded-3xl text-white shadow-md">
                      <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="text-teal-300" size={24}/>
                        <h3 className="text-xl font-black">AI Study Hacks</h3>
                      </div>
                      
                      <ul className="space-y-3">
                        {(Array.isArray(renderStudent.aiReportData.studyHacks) 
                          ? renderStudent.aiReportData.studyHacks 
                          : Array.isArray(renderStudent.aiReportData.studyHacks?.bullets) 
                            ? renderStudent.aiReportData.studyHacks.bullets 
                            : []
                        ).map((hack: any, i: number) => {
                          let title = "Tip";
                          let desc = "Keep studying consistently.";
                          if (typeof hack === 'string') {
                            const parts = hack.split(':');
                            title = parts[0]?.replace(/^- /, '') || title;
                            desc = parts.slice(1).join(':').trim() || title;
                          } else if (typeof hack === 'object' && hack !== null) {
                            title = hack.title || title;
                            desc = hack.desc || hack.description || desc;
                          }
                          return (
                            <li key={i} className="flex gap-3 items-start bg-teal-800 p-3 rounded-xl border border-teal-700">
                              <CheckCircle className="text-teal-300 shrink-0 mt-0.5" size={16} />
                              <div>
                                <h4 className="font-bold text-white text-sm">{title}</h4>
                                <p className="text-teal-200 text-xs mt-1 leading-relaxed line-clamp-2">{desc}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </section>
                </div>

                <div className="html2pdf__page-break"></div>

                {/* --- PAGE 2: SKILL GAP & CAREER BRIDGE --- */}
                <div className="mt-4">
                  <section className="grid grid-cols-2 gap-6 mb-6 avoid-page-break">
                    <div className="bg-orange-50 p-6 rounded-3xl border border-orange-200">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="text-orange-600" size={24}/>
                        <h3 className="text-xl font-black text-orange-900">Skill Gap Analysis</h3>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">
                          "{typeof renderStudent.aiReportData.skillGap === 'object' ? renderStudent.aiReportData.skillGap?.description || renderStudent.aiReportData.skillGap?.focus : renderStudent.aiReportData.skillGap || 'Requires further evaluation.'}"
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                       <div className="flex items-center gap-3 mb-4">
                        <User className="text-blue-600" size={24}/>
                        <h3 className="text-xl font-black text-slate-800">Psychometrician's Notes</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-loose italic border-l-4 border-blue-300 pl-4 font-medium">
                        "{renderStudent.aiReportData.psychometricianNote || renderStudent.aiReportData.counselorNotes || 'Continued observation recommended.'}"
                      </p>
                    </div>
                  </section>

                  <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6 avoid-page-break">
                    <div className="flex items-center gap-3 mb-6">
                      <Map className="text-blue-800" size={24}/>
                      <h3 className="text-xl font-black text-blue-900">Academic to Career Roadmap</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8 text-center">
                      <div className="border border-slate-200 p-4 rounded-xl bg-white shadow-sm">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-white">1</div>
                        <h4 className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wider">SS1 Subjects</h4>
                        <div className="flex flex-col gap-2">
                          {Array.isArray(renderStudent.aiReportData.roadmap?.step1) && renderStudent.aiReportData.roadmap.step1.map((s:any, i:number)=><div key={i} className="text-xs bg-slate-50 border border-slate-100 py-2 px-1 rounded font-semibold text-slate-700">{String(s)}</div>)}
                        </div>
                      </div>
                      <div className="border border-slate-200 p-4 rounded-xl bg-white shadow-sm">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto -mt-8 mb-3 border-4 border-white">2</div>
                        <h4 className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wider">JAMB Combo</h4>
                        <div className="flex flex-col gap-2">
                          {Array.isArray(renderStudent.aiReportData.roadmap?.step2) && renderStudent.aiReportData.roadmap.step2.map((s:any, i:number)=><div key={i} className="text-xs bg-blue-50 border border-blue-100 py-2 px-1 rounded font-bold text-blue-800">{String(s)}</div>)}
                        </div>
                      </div>
                    </div>

                    {Array.isArray(renderStudent.aiReportData.careerBridge) && (
                      <div className="mt-8">
                        <div className="flex items-center justify-center gap-2 mb-4 opacity-80">
                          <div className="h-px bg-slate-300 flex-1"></div>
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-4">University & Career Pathway Bridge</h3>
                          <div className="h-px bg-slate-300 flex-1"></div>
                        </div>
                        <div className="space-y-4">
                          {renderStudent.aiReportData.careerBridge.map((pathway: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-stretch gap-4 relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                              <div className="w-1/3 pr-2 border-r border-slate-100 flex flex-col justify-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">JAMB/Degree Path</p>
                                <p className="font-bold text-slate-800 text-xs">{pathway?.traditionalDegree || "Standard Degree"}</p>
                              </div>
                              <div className="w-1/3 pr-2 border-r border-slate-100 flex flex-col justify-center">
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Future Specialization</p>
                                <p className="font-black text-indigo-700 bg-indigo-50 inline-block px-2 py-1 rounded text-xs">{pathway?.futuristicCareer || "Modern Pathway"}</p>
                              </div>
                              <div className="w-1/3 flex flex-col justify-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Strategic Alignment</p>
                                <p className="text-[10px] text-slate-600 leading-relaxed">{pathway?.alignmentReason || "Provides solid foundational learning."}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                <div className="html2pdf__page-break"></div>

                {/* --- PAGE 3: COGNITIVE DATA --- */}
                <div className="mt-6 text-slate-800">
                  <div className="avoid-page-break mb-6">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">1. Cognitive Abilities Assessment</h2>
                    <p className="text-sm mb-4 text-slate-700 leading-relaxed text-justify">
                      The ACET Cognitive Abilities Assessment evaluates a student's core fluid intelligence and problem-solving capabilities across five distinct subtests. 
                      Rather than measuring learned academic knowledge, these subtests measure the underlying cognitive engine that drives future learning. 
                    </p>
                    <h3 className="font-bold text-slate-800 mb-3 text-sm">1.1. Subtest Scores & Interpretation</h3>
                    <table className="w-full text-left border-collapse font-sans text-sm border border-slate-300 mb-4">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="py-2 px-3 border border-slate-300">Subtest Domain</th>
                          <th className="py-2 px-3 border border-slate-300 text-center">Raw Score</th>
                          <th className="py-2 px-3 border border-slate-300 text-center">Z-Score (Est)</th>
                          <th className="py-2 px-3 border border-slate-300 text-center">Percentile</th>
                          <th className="py-2 px-3 border border-slate-300">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['Verbal Reasoning', 'Numerical Reasoning', 'Abstract/Logical Reasoning', 'Spatial & Mechanical Reasoning'].map((catName, idx) => {
                          const c = renderStudent.grading?.categories?.[catName];
                          if (!c || c.total === 0) return null; 
                          
                          const total = c.total;
                          const correct = c.correct;
                          const pct = Math.round((correct / total) * 100);
                          
                          let interp = "Average";
                          let zScore = ((pct - 50) / 15).toFixed(2);
                          if (pct < 40) interp = "Below Average";
                          if (pct > 75) interp = "Above Average";
                          
                          return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 border border-slate-300 font-semibold">{catName.replace(' Reasoning', '')}</td>
                            <td className="py-2 px-3 border border-slate-300 text-center font-semibold">{correct}/{total}</td>
                            <td className="py-2 px-3 border border-slate-300 text-center font-mono">{zScore}</td>
                            <td className="py-2 px-3 border border-slate-300 text-center">{pct}th</td>
                            <td className={`py-2 px-3 border border-slate-300 font-bold ${interp === 'Above Average' ? 'text-blue-700' : interp === 'Below Average' ? 'text-red-500' : 'text-slate-700'}`}>{interp}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>

                  <div className="html2pdf__page-break"></div>

                  {/* --- PAGE 4: PSYCHOLOGICAL DATA --- */}
                  <div className="avoid-page-break mb-6 mt-4">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2">2. Psychological & Behavioral Profile</h2>
                    <div className="mb-6">
                      <h3 className="font-bold text-slate-800 mb-2 text-sm">2.1. The Big Five (OCEAN) Personality Assessment</h3>
                      <table className="w-full text-left border-collapse font-sans text-sm border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="py-2 px-3 border border-slate-300">Personality Trait</th>
                            <th className="py-2 px-3 border border-slate-300 text-center">Score / 50</th>
                            <th className="py-2 px-3 border border-slate-300">Clinical Interpretation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderStudent.grading?.ocean?.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border border-slate-300 font-semibold">{p.trait}</td>
                              <td className="py-2 px-3 border border-slate-300 text-center font-bold">
                                {p.displayScore === "N/A" ? <span className="text-slate-400">N/A</span> : p.displayScore}
                              </td>
                              <td className="py-2 px-3 border border-slate-300 text-xs">
                                {p.displayScore === "N/A" ? <span className="text-slate-400 italic">{p.interpretation}</span> : p.interpretation}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-slate-800 mb-2 text-sm">2.2. Holland Code (RIASEC) Occupational Interests</h3>
                      <table className="w-full text-left border-collapse font-sans text-sm border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="py-2 px-3 border border-slate-300 w-1/4">RIASEC Code</th>
                            <th className="py-2 px-3 border border-slate-300 text-center w-1/4">Score / 50</th>
                            <th className="py-2 px-3 border border-slate-300">Alignment Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderStudent.grading?.holland?.map((h: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border border-slate-300 font-semibold">{h.code}</td>
                              <td className="py-2 px-3 border border-slate-300 text-center font-bold">
                                {h.displayScore === "N/A" ? <span className="text-slate-400">N/A</span> : h.displayScore}
                              </td>
                              <td className="py-2 px-3 border border-slate-300 text-xs">
                                {h.displayScore === "N/A" ? <span className="text-slate-400 italic">{h.interpretation}</span> : 
                                 h.displayScore >= 40 ? <span className="text-blue-700 font-bold">Strong Alignment</span> : 
                                 h.displayScore <= 25 ? <span className="text-slate-500">Low Alignment</span> : 'Moderate Alignment'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="html2pdf__page-break"></div>

                  {/* --- PAGE 5: SUMMARY & SIGNATURES --- */}
                  <div className="mt-6 text-slate-800 avoid-page-break">
                    <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-6">3. Integrated Summary and Recommendations</h2>
                    
                    <div className="space-y-6 mb-12">
                      <div>
                        <h3 className="font-bold text-slate-800 mb-2 text-sm">3.1. Summary of Key Findings</h3>
                        <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                          <strong className="text-slate-800 uppercase">{renderStudent.name || 'Student'}</strong> demonstrates strengths aligned with their recommended trajectory. As noted by our psychometric analysis: <em>"{renderStudent.aiReportData.psychometricianNote || renderStudent.aiReportData.counselorNotes || 'Continued observation recommended.'}"</em>
                        </p>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 mb-2 text-sm">3.2. Senior Secondary Specialization Recommendations</h3>
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-1 text-sm">
                          <p><strong className="text-blue-900">Primary Specialization:</strong> <span className="text-blue-800">{renderStudent.aiReportData.recommendation || renderStudent.aiReportData.recommendations?.primary || "Pending"}</span></p>
                          <p><strong className="text-blue-900">Secondary Specialization:</strong> <span className="text-blue-800">{renderStudent.aiReportData.specialization || renderStudent.aiReportData.recommendations?.secondary || "Pending"}</span></p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 mb-2 text-sm">3.3. Potential Career Paths</h3>
                        <p className="text-slate-600 text-sm mb-3">Based on the recommended senior secondary specializations and career mapping, here are some potential future paths the student may wish to explore:</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(renderStudent.aiReportData.roadmap?.step4) ? renderStudent.aiReportData.roadmap.step4.map((career: string, i: number) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-semibold text-xs border border-slate-200">
                              {career}
                            </span>
                          )) : <span className="text-sm text-slate-500">To be discussed during counseling.</span>}
                        </div>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-6">4. Official Endorsement & Signatures</h2>
                    <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                      The insights contained within this ACET Intelligence Report represent a synthesis of the candidate's cognitive potential, psychometric orientation, and academic readiness. A tailored guidance approach—integrating continuous mentorship, environmental support, and periodic academic re-evaluation—is strongly recommended to assist the student in actualizing their defined career and university trajectory.
                    </p>

                    {/* REDESIGNED SIGNATURES & VERIFICATION SECTION */}
                    <div className="space-y-8 avoid-page-break">
                      <div>
                        <p className="font-bold text-slate-800 text-sm mb-2">4.1 Internal Counselor's Verification Notes</p>
                        <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center">
                          <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">[Official School Use Only - Counselor Remarks]</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-12 pt-12">
                        <div className="border-t-2 border-slate-400 pt-2">
                          <p className="font-bold text-slate-800 text-center text-sm">Head of Counseling / Psychometrician</p>
                          <p className="text-slate-400 text-center text-[10px] mt-1 uppercase tracking-widest">Signature & Date</p>
                        </div>
                        <div className="border-t-2 border-slate-400 pt-2">
                          <p className="font-bold text-slate-800 text-center text-sm">Principal / Administrator</p>
                          <p className="text-slate-500 text-center text-xs mt-1 uppercase tracking-wide font-semibold">{renderStudent.organizationId || "ROSEVILLE SECONDARY SCHOOL"}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}