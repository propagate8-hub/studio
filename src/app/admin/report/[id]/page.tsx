"use client";

import React, { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowDownToLine, Map, Target, BookOpen, Brain, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const studentId = unwrappedParams.id;
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const docRef = doc(db, 'Students', studentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching student report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('acet-report-container');
      
      // FIX 2: Safety check to prove to TypeScript that the element actually exists
      if (!element) {
        console.error("PDF generation failed: Report container not found.");
        setIsDownloading(false);
        return;
      }
      
      const opt = {
        margin:       0.4,
        filename:     `${student?.name?.replace(/\s+/g, '_') || 'Student'}_ACET_Report.pdf`,
        // FIX 1: Added 'as const' to strictly lock the type as 'jpeg'
        image:        { type: 'jpeg' as const, quality: 0.98 }, 
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading ACET Intelligence Engine...</div>;
  if (!student) return <div className="p-10 text-center font-bold text-red-500">Student Record Not Found.</div>;

  const aiData = student.aiReportData;
  const gradingResult = student.gradingResult;

  if (!aiData || !gradingResult) {
    return <div className="p-10 text-center font-bold text-slate-500">No AI Report data available for this student yet. Generate it from the Dashboard.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 bg-slate-100 min-h-screen">
      {/* Admin Download Header */}
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Intelligence Report</h1>
          <p className="text-sm text-slate-500">Ready for export and printing.</p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50"
        >
          <ArrowDownToLine size={20} />
          {isDownloading ? 'Generating PDF...' : 'Export Official PDF'}
        </button>
      </div>

      {/* ---------------- A4 PDF CONTAINER START ---------------- */}
      <div id="acet-report-container" className="bg-white shadow-2xl overflow-hidden text-slate-800 text-[15px] leading-relaxed mx-auto" style={{ width: '8.5in' }}>
        
        {/* ================= PAGE 1 ================= */}
        <div className="p-10">
          <header className="border-b-4 border-blue-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-blue-900 tracking-tight mb-2">ACET INTELLIGENCE REPORT</h1>
              <h2 className="text-xl font-bold text-slate-700 uppercase">{student.name} • JSS 3</h2>
              <p className="text-slate-500 font-medium">Roseville Secondary School</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
              <p className="font-semibold text-slate-700">{new Date().toLocaleDateString()}</p>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8 mb-8">
            <div className="col-span-8 space-y-8">
              <section className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-900">
                  <Target size={24} className="text-blue-600" />
                  <h3 className="text-lg font-black uppercase tracking-wide">Primary Recommendation</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-blue-900">{aiData.recommendations.primary}</h4>
                  <p className="text-blue-700 font-medium bg-blue-100/50 inline-block px-3 py-1 rounded-md">
                    Focus Area: {aiData.recommendations.secondary}
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Brain size={24} className="text-blue-600" />
                  <h3 className="text-lg font-black uppercase tracking-wide text-slate-800">Al Study Hacks</h3>
                </div>
                <ul className="grid grid-cols-2 gap-4">
                  {aiData.studyHacks?.map((hack: string, i: number) => {
                    const [title, ...descArr] = hack.split(':');
                    return (
                      <li key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-800 block mb-1">{title.replace(/^- /, '')}</span>
                        <span className="text-sm text-slate-600 leading-snug">{descArr.join(':').trim()}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <div className="col-span-4 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Overall Accuracy</h3>
                <div className="text-5xl font-black text-blue-600">{gradingResult.overallPercentage}%</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-5">Cognitive Domains</h3>
                <div className="space-y-5">
                  {['Verbal Reasoning', 'Numerical Reasoning', 'Abstract/Logical Reasoning', 'Spatial & Mechanical Reasoning'].map((catName) => {
                    const cat = gradingResult?.categories?.[catName];
                    
                    // ADAPTIVE FIX: Hide if adaptive test skipped this category completely
                    if (!cat || cat.total === 0) return null; 
                    
                    const score = Math.round((cat.correct / cat.total) * 100);
                    return (
                      <div key={catName} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">{catName.replace(' Reasoning', '')}</span>
                          <span className={`font-black ${score > 60 ? 'text-blue-600' : 'text-slate-500'}`}>{score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${score}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Moved Skill Gap up here so there is no awkward blank space */}
          <div className="grid grid-cols-2 gap-6">
            <section className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
              <h3 className="text-sm font-bold uppercase tracking-widest text-orange-600 mb-3 flex items-center gap-2">
                <AlertCircle size={16} /> Skill Gap Analysis
              </h3>
              <p className="text-slate-700 italic">"{aiData.skillGap}"</p>
            </section>

            <section className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
              <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
                <ClipboardCheck size={16} /> Psychometrician's Notes
              </h3>
              <p className="text-slate-700 italic leading-relaxed">"{aiData.psychometricianNote}"</p>
            </section>
          </div>
        </div>

        {/* ================= FORMAT FIX: PAGE BREAK MOVED HERE ================= */}
        <div className="html2pdf__page-break"></div>

        {/* ================= PAGE 2 (Career Bridge) ================= */}
        <div className="p-10">
          <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <Map size={28} className="text-blue-700" />
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">Academic to Career Roadmap</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex justify-center -mt-9 mb-3">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md border-2 border-white">1</span>
                </div>
                <h3 className="text-center font-bold text-slate-800 uppercase tracking-widest text-sm mb-4">SS1 Subjects (NERDC)</h3>
                <div className="space-y-2">
                  {aiData.roadmap.step1.map((sub: string, i: number) => (
                    <div key={i} className="bg-slate-50 text-slate-700 py-2.5 px-3 rounded-lg text-center font-semibold text-sm border border-slate-100">
                      {sub}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex justify-center -mt-9 mb-3">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md border-2 border-white">2</span>
                </div>
                <h3 className="text-center font-bold text-slate-800 uppercase tracking-widest text-sm mb-4">JAMB Combination</h3>
                <div className="space-y-2">
                  {aiData.roadmap.step2.map((sub: string, i: number) => (
                    <div key={i} className="bg-blue-50 text-blue-800 py-2.5 px-3 rounded-lg text-center font-bold text-sm border border-blue-100">
                      {sub}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {aiData.careerBridge && (
              <div className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
                  <div className="h-px bg-slate-300 flex-1"></div>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest text-center px-4">University & Career Pathway Bridge</h3>
                  <div className="h-px bg-slate-300 flex-1"></div>
                </div>
                <p className="text-center text-sm text-slate-500 mb-6 italic">Mapping approved Nigerian university degrees directly to futuristic global specializations.</p>

                <div className="space-y-4">
                  {aiData.careerBridge.map((pathway: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-stretch gap-6 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                      
                      <div className="w-1/3 pr-4 border-r border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">JAMB/Degree Path</p>
                        <p className="font-bold text-slate-800">{pathway.traditionalDegree}</p>
                      </div>

                      <div className="w-1/3 pr-4 border-r border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Future Specialization</p>
                        <p className="font-black text-indigo-700 bg-indigo-50 inline-block px-2 py-1 rounded text-sm">{pathway.futuristicCareer}</p>
                      </div>

                      <div className="w-1/3 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Strategic Alignment</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{pathway.alignmentReason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="html2pdf__page-break"></div>

        {/* ================= PAGE 3 (Cognitive Table) ================= */}
        <div className="p-10">
          <h2 className="text-xl font-bold text-blue-900 border-b border-slate-200 pb-3 mb-6">1. Cognitive Abilities Assessment</h2>
          <p className="text-slate-600 mb-4">
            The ACET Cognitive Abilities Assessment evaluates a student's core fluid intelligence and problem-solving capabilities across distinct subtests. 
            Rather than measuring learned academic knowledge, these subtests measure the underlying cognitive engine that drives future learning.
          </p>
          
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8">
            <h4 className="font-bold text-slate-800 mb-2">Understanding the Metrics:</h4>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
              <li><strong>Raw Score:</strong> The absolute number of questions answered correctly based on adaptive delivery.</li>
              <li><strong>Z-Score:</strong> A statistical measurement indicating deviation from the Cohort Average.</li>
              <li><strong>Percentile Rank:</strong> Indicates the percentage of peers that the student outperformed.</li>
            </ul>
          </div>

          <h3 className="font-bold text-slate-800 mb-4 text-lg">1.1. Subtest Scores & Interpretation</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Subtest Domain</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Raw Score</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Z-Score (Est)</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Percentile</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {['Verbal Reasoning', 'Numerical Reasoning', 'Abstract/Logical Reasoning', 'Spatial & Mechanical Reasoning'].map((catName, idx) => {
                  const c = gradingResult.categories[catName];
                  
                  // ADAPTIVE FIX: Hide row if adaptive test skipped it (0 total questions)
                  if (!c || c.total === 0) return null; 
                  
                  const pct = Math.round((c.correct / c.total) * 100);
                  let interp = "Average";
                  let zScore = ((pct - 50) / 15).toFixed(2);
                  
                  if (pct < 40) interp = "Below Average";
                  if (pct > 75) interp = "Above Average";

                  return (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 px-4 font-medium text-slate-800">{catName.replace(' Reasoning', '')}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{c.correct}/{c.total}</td>
                      <td className="py-3 px-4 text-slate-600">{zScore}</td>
                      <td className="py-3 px-4 text-slate-600">{pct}th</td>
                      <td className={`py-3 px-4 font-bold ${pct > 75 ? 'text-blue-600' : pct < 40 ? 'text-red-500' : 'text-slate-700'}`}>
                        {interp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="html2pdf__page-break"></div>

        {/* ================= PAGE 4 (Psychology) ================= */}
        <div className="p-10">
          <h2 className="text-xl font-bold text-blue-900 border-b border-slate-200 pb-3 mb-6">2. Psychological & Behavioral Profile</h2>
          
          <div className="mb-10">
            <h3 className="font-bold text-slate-800 mb-3 text-lg">2.1. The Big Five (OCEAN) Personality Assessment</h3>
            <p className="text-slate-600 mb-5 text-sm">This assessment measures where the student falls across globally recognized personality dimensions. These traits significantly influence learning habits, emotional resilience, and eventual cultural fit within a workplace.</p>
            
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Personality Trait</th>
                    <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Score / 50</th>
                    <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Clinical Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {aiData.ocean?.map((trait: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 px-4 font-medium text-slate-800">{trait.trait}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{trait.score}</td>
                      <td className="py-3 px-4 text-slate-600">{trait.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">2.2. Holland Code (RIASEC) Occupational Interests</h3>
            <p className="text-slate-600 mb-5 text-sm">The Holland Occupational Themes theory posits that individuals perform best in academic streams and careers that match their inherent interests. The combination of their top three categories forms their "Holland Code."</p>
            
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">RIASEC Code</th>
                    <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Score / 50</th>
                    <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wide">Alignment Description</th>
                  </tr>
                </thead>
                <tbody>
                  {aiData.holland?.map((trait: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 px-4 font-medium text-slate-800">{trait.trait}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{trait.score}</td>
                      <td className="py-3 px-4 text-slate-600">{trait.alignment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="html2pdf__page-break"></div>

        {/* ================= PAGE 5 (Summary & Signatures) ================= */}
        <div className="p-10">
          <h2 className="text-xl font-bold text-blue-900 border-b border-slate-200 pb-3 mb-6">3. Integrated Summary and Recommendations</h2>
          
          <div className="space-y-6 mb-12">
            <div>
              <h3 className="font-bold text-slate-800 mb-2">3.1. Summary of Key Findings</h3>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <strong className="text-slate-800 uppercase">{student.name}</strong> demonstrates strengths aligned with their recommended trajectory. As noted by our psychometric analysis: <em>"{aiData.psychometricianNote}"</em>
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-2">3.2. Senior Secondary Specialization Recommendations</h3>
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-2">
                <p><strong className="text-blue-900">Primary Specialization:</strong> <span className="text-blue-800">{aiData.recommendations.primary}</span></p>
                <p><strong className="text-blue-900">Secondary Specialization:</strong> <span className="text-blue-800">{aiData.recommendations.secondary}</span></p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-2">3.3. Potential Career Paths</h3>
              <p className="text-slate-600">Based on the recommended senior secondary specializations and career mapping, here are some potential future paths the student may wish to explore:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {aiData.roadmap.step4.map((career: string, i: number) => (
                  <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-semibold text-sm border border-slate-200">
                    {career}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-blue-900 border-b border-slate-200 pb-3 mb-6">4. Official Endorsement & Signatures</h2>
          <p className="text-slate-600 text-sm mb-12">
            The insights contained within this ACET Intelligence Report represent a synthesis of the candidate's cognitive potential, psychometric orientation, and academic readiness. A tailored guidance approach—integrating continuous mentorship, environmental support, and periodic academic re-evaluation—is strongly recommended.
          </p>

          <div className="grid grid-cols-2 gap-12 mt-16">
            <div className="border-t-2 border-slate-300 pt-3">
              <p className="font-bold text-slate-800 text-center">4.1 Internal Counselor's Verification Notes</p>
              <p className="text-slate-400 text-center text-xs mt-1">[Official School Use Only]</p>
            </div>
            <div className="border-t-2 border-slate-300 pt-3">
              <p className="font-bold text-slate-800 text-center">Principal / Administrator</p>
              <p className="text-slate-500 text-center text-sm mt-1 uppercase tracking-wide font-semibold">ROSEVILLE SECONDARY SCHOOL</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Temporary Lucide icon fallbacks since they weren't in your original imports list
const AlertCircle = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
const ClipboardCheck = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
);