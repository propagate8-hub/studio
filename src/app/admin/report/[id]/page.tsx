"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, XCircle, CheckCircle, User, Loader2, ArrowLeft, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// 🔥 FIREBASE IMPORTS
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
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

      const bankSnap = await getDocs(collection(db, 'Assessments_Bank'));
      const masterKey: Record<string, any> = {};
      bankSnap.docs.forEach(doc => { masterKey[doc.id] = doc.data(); });

      let correctCount = 0;
      const answers = studentData.finalAnswers || {};
      const breakdownArray: any[] = [];

      Object.keys(answers).forEach((questionId) => {
        const studentAnswer = answers[questionId];
        const questionData = masterKey[questionId];
        
        if (questionData) {
          const isCorrect = studentAnswer === (questionData.correct_answer || questionData.correctAnswer || questionData.answer);
          if (isCorrect) correctCount++;

          breakdownArray.push({
            questionId,
            text: questionData.question || questionData.text || "Question Text Missing",
            studentAnswer,
            correctAnswer: questionData.correct_answer || questionData.correctAnswer || questionData.answer,
            isCorrect
          });
        }
      });

      const totalQuestions = Object.keys(answers).length;
      const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      setGradingResult({ score: correctCount, total: totalQuestions, percentage, breakdown: breakdownArray });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Trigger the AI Backend Pipeline
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to AI Engine.');
      }

      // If successful, re-fetch the student data so the new AI report shows up instantly!
      await fetchStudentData();
      
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setAiError(err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-primary">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Analyzing responses & generating report...</p>
      </div>
    );
  }

  if (!student) {
    return <div className="p-8 text-center text-red-500">Candidate record not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6 print:p-0 print:space-y-0">
      
      {/* HEADER NAVIGATION (Hidden when printing!) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          
          {/* THE AI TRIGGER BUTTON */}
          {!student.aiReportData && (
            <button 
              onClick={generateAIProfile}
              disabled={isGeneratingAI}
              className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm ${isGeneratingAI ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {isGeneratingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isGeneratingAI ? 'AI Engine Processing (This takes ~30s)...' : 'Generate 15-Page ACET Profile'}
            </button>
          )}

<button 
            onClick={async () => {
              // Dynamically import the library so it doesn't break Next.js server rendering
              const html2pdf = (await import('html2pdf.js')).default;
              const element = document.getElementById('report-content');
              
              const opt = {
                margin:       0, // Set margin to 0 here because we added padding to the backend divs!
                filename:     `${student.name.replace(/\s+/g, '_')}_ACET_Profile.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
                // Add this property:
                pagebreak:    { mode: ['css', 'legacy'] }
              };
              
              // Generate and download the PDF!
              html2pdf().set(opt).from(element).save();
            }} 
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={18} /> Download True PDF
          </button>
        </div>
      </div>

      {aiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 print:hidden">
          <AlertTriangle size={20} />
          <p className="font-medium">AI Pipeline Error: {aiError}</p>
        </div>
      )}

      {/* REPORT CARD HEADER (Displays on Screen & Print) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6 print:shadow-none print:border-b print:rounded-none">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-50 text-[#004AAD] rounded-full flex items-center justify-center">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">{student.name}</h1>
            <p className="text-gray-500 text-lg font-medium mt-1">
              {student.organizationId || 'B2C Candidate'} • {student.classLevel}
            </p>
            <div className="flex gap-3 mt-3">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold font-mono">ID: {student.acetId}</span>
              {student.aiReportData && (
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1"><Bot size={12}/> ACET Profile Attached</span>
              )}
            </div>
          </div>
        </div>

        <div className="text-center bg-gray-50 p-6 rounded-xl border border-gray-100 min-w-[200px] print:bg-transparent print:border-none">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Final Score</p>
          <div className="text-5xl font-black text-[#004AAD]">{gradingResult?.percentage}%</div>
          <p className="text-gray-500 font-medium mt-2">{gradingResult?.score} out of {gradingResult?.total} Correct</p>
        </div>
      </div>

      {/* RAW DATA BREAKDOWN (Hidden when printing the AI PDF!) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print:hidden mt-8">
        <div className="bg-gray-50 p-6 border-b border-gray-200 flex items-center gap-3">
          <FileText className="text-gray-500" />
          <h2 className="text-xl font-bold text-gray-800">Raw Item Analysis (Admin View)</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {gradingResult?.breakdown.map((item: any, index: number) => (
            <div key={index} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {item.isCorrect ? <CheckCircle className="text-green-500" size={28} /> : <XCircle className="text-red-500" size={28} />}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-gray-900 font-medium leading-relaxed">
                  <span className="font-bold text-gray-400 mr-2">{index + 1}.</span> {item.text}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className={`px-3 py-1.5 rounded-md font-bold ${item.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    Candidate Answer: {item.studentAnswer}
                  </div>
                  {!item.isCorrect && (
                    <div className="px-3 py-1.5 rounded-md font-bold bg-gray-100 text-gray-600">
                      Correct Answer: {item.correctAnswer || "Not set in database"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* THE 15-PAGE AI RENDERER */}
      {student.aiReportData && (
        <div id="report-content" className="mt-12 pt-8 border-t-2 border-dashed border-gray-200 print:border-none print:mt-4 print:pt-0">
          <div className="flex items-center gap-3 mb-8 print:hidden">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><Sparkles size={24} /></div>
            <h2 className="text-2xl font-black text-gray-900">Comprehensive AI Profile</h2>
          </div>
          
          {/* This div consumes the raw HTML from OpenAI.
            The `prose` classes make it look beautiful on screen.
            The `print:prose` classes ensure text stays dark and page breaks format properly on PDF export.
          */}
          <div 
            className="prose prose-lg max-w-none prose-headings:text-[#004AAD] prose-h2:border-b-2 prose-h2:border-gray-100 prose-h2:pb-2 prose-p:text-gray-700 prose-li:text-gray-700 bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0 print:prose-p:text-black print:prose-headings:text-black print:prose-li:text-black"
            dangerouslySetInnerHTML={{ __html: student.aiReportData }}
          />
        </div>
      )}

    </div>
  );
}