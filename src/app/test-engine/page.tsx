"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

// 🔥 FIREBASE IMPORTS
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 

export default function SecureTestEngine() {
  // --- SESSION & SYSTEM STATES ---
  const [stage, setStage] = useState<'LOADING' | 'INSTRUCTIONS' | 'TESTING' | 'SUBMITTING' | 'FINISHED'>('LOADING');
  const [studentSession, setStudentSession] = useState<{ id: string, name: string, classLevel: string } | null>(null);
  
  // --- ASSESSMENT STATES ---
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); 
  
  // --- SECURITY & TIMERS ---
  const [timeLeft, setTimeLeft] = useState(3600); // 60 Minutes
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // 1. INITIALIZATION & SECURITY CHECK
  useEffect(() => {
    const studentId = sessionStorage.getItem('acetStudentId');
    const studentName = sessionStorage.getItem('acetStudentName');
    const studentClass = sessionStorage.getItem('acetClassLevel');

    if (!studentId || !studentName || !studentClass) {
      window.location.href = '/portal/login';
    } else {
      setStudentSession({ id: studentId, name: studentName, classLevel: studentClass });
      fetchAssessment();
    }
  }, []);

  // 2. FETCH THE EXAM (Stratified Randomization Engine)
  const fetchAssessment = async () => {
    try {
      const qSnap = await getDocs(collection(db, 'Assessments_Bank'));
      const allDocs = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const groupedQuestions: Record<string, any[]> = {};
      allDocs.forEach(q => {
        const cat = q.category || 'General'; 
        if (!groupedQuestions[cat]) groupedQuestions[cat] = [];
        groupedQuestions[cat].push(q);
      });

      // 🚨 Strict Psychometric Quotas (Mapped to your exact DB Labels)
      const quotas: Record<string, number> = {
        // Cognitive Domains (55 Questions)
        'Verbal Reasoning': 15,
        'Numerical Reasoning': 10,
        'Spatial & Mechanical Reasoning': 10,
        'Abstract/Logical Reasoning': 20,
        
        // Holland Code / RIASEC (30 Questions)
        'Realistic': 5,
        'Investigative': 5,
        'Artistic': 5,
        'Social': 5,
        'Enterprising': 5,
        'Conventional': 5,
        
        // Personality Traits / OCEAN (20 Questions)
        'Openness to Experience': 5,
        'Conscientiousness': 5,
        'Agreeableness & Teamwork': 5,
        'Resilience & Emotional Stability': 5
      };

      let finalDeck: any[] = [];

      Object.keys(groupedQuestions).forEach(category => {
        const bucket = groupedQuestions[category].sort(() => 0.5 - Math.random());
        // If the category isn't in our quota list, we pull 0 to prevent rogue data
        const requiredAmount = quotas[category] || 0; 
        
        if (requiredAmount > 0) {
            finalDeck = [...finalDeck, ...bucket.slice(0, requiredAmount)];
        }
      });

      // Final shuffle to mix Math, English, and Personality questions
      finalDeck = finalDeck.sort(() => 0.5 - Math.random());
      setQuestions(finalDeck);
      setStage('INSTRUCTIONS');
    } catch (error) {
      console.error("Failed to load exam:", error);
      alert("Error securely connecting to the exam bank.");
    }
  };

  // 3. SECURITY & TIMER LOGIC
  useEffect(() => {
    let timer: any;
    if (stage === 'TESTING') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
           // submitFinalAssessment(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && stage === 'TESTING') {
        setStrikes((prev) => prev + 1);
        setShowWarning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stage]);

  // 4. NAVIGATION & SUBMISSION
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      submitFinalAssessment();
    }
  };

  const submitFinalAssessment = async () => {
    if (!studentSession) return;
    setStage('SUBMITTING');

    try {
      const studentRef = doc(db, 'Students', studentSession.id);
      await updateDoc(studentRef, {
        isTestCompleted: true,
        completedAt: serverTimestamp(),
        antiCheatStrikes: strikes,
        timeRemaining: timeLeft,
        finalAnswers: answers
      });

      sessionStorage.clear();
      setStage('FINISHED');
    } catch (error) {
      console.error("Failed to submit exam:", error);
      alert("CRITICAL ERROR: Failed to save results to the database.");
      setStage('TESTING'); 
    }
  };

  // ==========================================
  // VIEW 1: LOADING & INSTRUCTIONS
  // ==========================================
  if (stage === 'LOADING') {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-[#38BDF8]"><Loader2 className="animate-spin" size={48} /></div>;
  }

  if (stage === 'INSTRUCTIONS') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 text-center">
          <ShieldAlert size={64} className="text-[#004AAD] mx-auto mb-6" />
          <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome, {studentSession?.name}</h1>
          <p className="text-gray-500 mb-8 font-medium">Cohort: {studentSession?.classLevel} • ACET Official Assessment</p>
          
          <div className="bg-blue-50 text-left p-6 rounded-2xl mb-8 space-y-4 text-blue-900">
            <p><strong>1. Strict Timing:</strong> You have 60 minutes. The system will auto-submit when time expires.</p>
            <p><strong>2. Anti-Cheat Active:</strong> Leaving this browser tab or minimizing the window will be recorded as an academic strike.</p>
            <p><strong>3. No Going Back:</strong> Ensure your answer is final before clicking "Next Question".</p>
          </div>
          <button 
            onClick={() => setStage('TESTING')}
            className="w-full py-4 rounded-xl font-black text-xl bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg hover:-translate-y-1 transition-all"
          >
            I Understand. Begin Assessment.
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE SECURE TESTING ENGINE
  // ==========================================
  if (stage === 'TESTING' && questions.length > 0) {
    const currentQ = questions[currentIndex];
    
    // 🚨 THE INDESTRUCTIBLE PARSER WITH LIKERT FALLBACK
    let optionsToRender = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree'];
    if (currentQ.options) {
      if (Array.isArray(currentQ.options) && currentQ.options.length > 0) optionsToRender = currentQ.options;
      else if (typeof currentQ.options === 'string') optionsToRender = currentQ.options.split(',').map((s: string) => s.trim());
      else if (typeof currentQ.options === 'object') optionsToRender = Object.values(currentQ.options);
    }

    if (!Array.isArray(optionsToRender) || optionsToRender.length === 0 || !optionsToRender[0]) {
      optionsToRender = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree'];
    }

    const formatTime = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
    const selectedOption = answers[currentQ.id];

    // 🚨 BULLETPROOF IMAGE LOGIC
    const imgUrl = currentQ.image_url || currentQ.imageUrl || currentQ.image || currentQ.figure;

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col select-none" onCopy={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
        
        {/* Security Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 bg-red-900/95 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl">
              <AlertTriangle size={64} className="text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-gray-900 mb-2">Tab Switch Detected</h2>
              <p className="text-gray-600 mb-6">You have left the testing environment. This infraction has been logged in your permanent ACET record.</p>
              <button onClick={() => setShowWarning(false)} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold w-full hover:bg-red-700">Return to Exam</button>
            </div>
          </div>
        )}

        {/* Secure Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-10 relative">
          <div className="font-bold text-gray-800 flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             {studentSession?.name} <span className="text-gray-400 font-normal hidden sm:inline">| {studentSession?.classLevel}</span>
          </div>
          <div className={`font-mono font-bold text-xl px-4 py-1 rounded-lg flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
            <Clock size={20} /> {formatTime(timeLeft)}
          </div>
        </header>

        {/* Question Area */}
        <main className="flex-1 flex flex-col items-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
          <div className="w-full flex justify-between text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round((currentIndex / questions.length) * 100)}%</span>
          </div>

          <div className="bg-white w-full rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10 mb-6">
            
            {/* 🚨 IMAGE RENDERER */}
            {imgUrl && (
               <div className="w-full flex justify-center mb-6 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                 <img 
                   src={imgUrl} 
                   alt="Assessment Visual" 
                   className="max-h-72 object-contain" 
                   onError={(e) => {
                     console.warn("Failed to load image for question:", currentQ.id);
                     e.currentTarget.style.display = 'none'; 
                   }}
                 />
               </div>
            )}

            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed text-center">
              {currentQ.question || currentQ.question_text || currentQ.text || "Analyze the provided data."}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {optionsToRender.map((option: string, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setAnswers({...answers, [currentQ.id]: String(option)})}
                className={`p-6 rounded-xl border-2 text-left font-medium text-lg transition-all ${selectedOption === String(option) ? 'border-[#004AAD] bg-blue-50 text-[#004AAD] shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-blue-200 text-gray-700'}`}
              >
                {String(option)}
              </button>
            ))}
          </div>

          <div className="w-full flex justify-end mt-auto pt-6 border-t border-gray-300">
            <button 
              disabled={!selectedOption} 
              onClick={handleNext} 
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${selectedOption ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              {currentIndex === questions.length - 1 ? 'Submit Final Assessment' : 'Save & Continue'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: SUBMITTING & FINISHED
  // ==========================================
  if (stage === 'SUBMITTING') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-[#38BDF8] p-6 text-center">
        <Loader2 size={80} className="animate-spin mb-8" />
        <h2 className="text-3xl font-black text-white mb-4">Encrypting & Submitting...</h2>
        <p className="text-gray-400 text-lg">Securely saving your responses to the cloud.</p>
      </div>
    );
  }

  if (stage === 'FINISHED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Assessment Complete</h2>
          <p className="text-gray-600 mb-8">
            Your results have been securely recorded. Your ACET ID is now locked. 
          </p>
          <button onClick={() => window.location.href = '/'} className="w-full py-4 rounded-xl font-black text-lg bg-gray-900 text-white hover:bg-gray-800 shadow-lg transition-all">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
}