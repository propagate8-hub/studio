"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Mail, GraduationCap, ArrowRight, BrainCircuit, Lock, Phone, Loader2 } from 'lucide-react';

// 🔥 FIREBASE IMPORTS
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase'; 

export default function MarketingDemo() {
  const [stage, setStage] = useState<'LOBBY' | 'TESTING' | 'ANALYZING' | 'LEAD_CAPTURE'>('LOBBY');
  const [classLevel, setClassLevel] = useState<'JSS 3' | 'SSS 3' | null>(null);
  
  // 🔥 DATABASE STATES
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Timer & Anti-Cheat Logic
  useEffect(() => {
    let timer: any;
    if (stage === 'TESTING') {
      timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
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

  // ==========================================
  // 🔥 PIPELINE 1: PULL RANDOM QUESTIONS
  // ==========================================
  const startDemo = async () => {
    setIsLoading(true);
    try {
      const qSnap = await getDocs(collection(db, 'Assessments_Bank'));
      const allDocs = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const shuffled = allDocs.sort(() => 0.5 - Math.random()).slice(0, 10);
      setQuestions(shuffled);
      setStage('TESTING');
    } catch (error) {
      console.error("Failed to load questions:", error);
      alert("Error connecting to the question bank. Please try again.");
    }
    setIsLoading(false);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setStage('ANALYZING');
      setTimeout(() => setStage('LEAD_CAPTURE'), 3000);
    }
  };

  // ==========================================
  // 🔥 PIPELINE 2: PUSH LEAD TO FIREBASE
  // ==========================================
  const submitLeadDetails = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'Marketing_Leads'), {
        email,
        phone,
        classLevel,
        antiCheatStrikes: strikes,
        completedAt: serverTimestamp(),
        source: 'Free_Nano_Demo'
      });
      
      alert("Success! Your AI Report is being generated. Our team will message you shortly.");
      window.location.href = '/'; 
    } catch (error) {
      console.error("Failed to save lead:", error);
      alert("There was an error saving your details.");
    }
    setIsSubmitting(false);
  };

  // ==========================================
  // VIEW 1: LOBBY
  // ==========================================
  if (stage === 'LOBBY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-[#004AAD] font-bold text-sm mb-4">
            <BrainCircuit size={18} /> Free Nano-Assessment
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Discover your child's true <span className="text-[#004AAD]">cognitive potential.</span>
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <button onClick={() => setClassLevel('JSS 3')} className={`p-8 rounded-2xl border-2 text-left transition-all ${classLevel === 'JSS 3' ? 'border-[#004AAD] bg-blue-50 shadow-md scale-105' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
              <GraduationCap size={40} className={`mb-4 ${classLevel === 'JSS 3' ? 'text-[#004AAD]' : 'text-gray-400'}`} />
              <h3 className="text-2xl font-bold text-gray-900">JSS 3 Cohort</h3>
              <p className="text-gray-500 mt-2">Transitioning to Senior Secondary</p>
            </button>
            <button onClick={() => setClassLevel('SSS 3')} className={`p-8 rounded-2xl border-2 text-left transition-all ${classLevel === 'SSS 3' ? 'border-[#004AAD] bg-blue-50 shadow-md scale-105' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
              <GraduationCap size={40} className={`mb-4 ${classLevel === 'SSS 3' ? 'text-[#004AAD]' : 'text-gray-400'}`} />
              <h3 className="text-2xl font-bold text-gray-900">SSS 3 Cohort</h3>
              <p className="text-gray-500 mt-2">Preparing for WAEC & JAMB</p>
            </button>
          </div>
          <button 
            disabled={!classLevel || isLoading}
            onClick={startDemo}
            className={`mt-8 px-12 py-5 rounded-full font-black text-xl flex items-center justify-center gap-3 mx-auto w-full md:w-auto transition-all ${classLevel ? 'bg-[#004AAD] text-white hover:bg-blue-800 hover:-translate-y-1 shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {isLoading ? <><Loader2 className="animate-spin" /> Loading Bank...</> : <>Start 5-Minute Demo <ArrowRight /></>}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: TESTING
  // ==========================================
  if (stage === 'TESTING' && questions.length > 0) {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };
    
    const currentQ = questions[currentIndex];
    
    // 🔥 THE INDESTRUCTIBLE PARSER
    let optionsToRender = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree'];

    if (currentQ.options) {
      if (Array.isArray(currentQ.options) && currentQ.options.length > 0) {
        optionsToRender = currentQ.options;
      } else if (typeof currentQ.options === 'string') {
        optionsToRender = currentQ.options.split(',').map((s: string) => s.trim());
      } else if (typeof currentQ.options === 'object') {
        optionsToRender = Object.values(currentQ.options);
      }
    }

    if (!Array.isArray(optionsToRender) || optionsToRender.length === 0 || !optionsToRender[0]) {
      optionsToRender = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree'];
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
        
        {showWarning && (
          <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl">
              <ShieldAlert size={64} className="text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-gray-900 mb-2">Security Warning</h2>
              <p className="text-gray-600 mb-6">You have left the testing environment. This action has been recorded.</p>
              <p className="text-sm font-bold text-red-600 mb-6">Strikes Recorded: {strikes}</p>
              <button onClick={() => setShowWarning(false)} className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold w-full hover:bg-red-700">I Understand</button>
            </div>
          </div>
        )}

        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="font-bold text-gray-500 hidden sm:block">{classLevel} Demo</div>
          <div className="font-mono font-bold text-lg text-red-600 bg-red-50 px-4 py-1 rounded-md ml-auto flex items-center gap-2">
            <Clock size={20} /> {formatTime(timeLeft)}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
          <div className="w-full mb-8">
            <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round((currentIndex / questions.length) * 100)}% Completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-[#38BDF8] h-2.5 rounded-full transition-all duration-500" style={{ width: `${(currentIndex / questions.length) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-white w-full rounded-2xl shadow-sm border p-8 md:p-12 mb-6 text-center">
            {currentQ.image_url && (
              <img src={currentQ.image_url} alt="Cognitive Visual" className="max-h-64 mx-auto mb-6 rounded-lg object-contain" />
            )}
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed">
              {currentQ.question || currentQ.question_text || currentQ.text || "Analyze the information provided above."}
            </h2>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {optionsToRender.map((option: string, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setSelectedOption(option)} 
                className={`p-6 rounded-xl border-2 text-left font-medium text-lg transition-all ${selectedOption === option ? 'border-[#004AAD] bg-blue-50 text-[#004AAD] shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-blue-200'}`}
              >
                {String(option)}
              </button>
            ))}
          </div>

          <div className="w-full flex justify-end border-t border-gray-200 pt-6 mt-auto">
            <button 
              disabled={!selectedOption} 
              onClick={handleNextQuestion} 
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${selectedOption ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {currentIndex === questions.length - 1 ? 'Analyze Results' : 'Next Question'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: ANALYZING
  // ==========================================
  if (stage === 'ANALYZING') {
    return (
      <div className="min-h-screen bg-[#004AAD] flex flex-col items-center justify-center text-white p-6 text-center">
        <BrainCircuit size={80} className="animate-pulse mb-8 text-[#38BDF8]" />
        <h2 className="text-3xl font-black mb-4">Analyzing Cognitive Velocity...</h2>
        <p className="text-blue-200 text-lg">Cross-referencing your {classLevel} baseline with 50,000+ data points.</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: LEAD CAPTURE
  // ==========================================
  if (stage === 'LEAD_CAPTURE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Report Generated!</h2>
          <p className="text-gray-600 mb-8">
            Your partial {classLevel} metrics are ready. Enter your details to unlock your baseline metrics.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
              <input 
                type="email" 
                placeholder="Parent/Guardian Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#004AAD] focus:outline-none text-lg" 
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-4 text-gray-400" size={20} />
              <input 
                type="tel" 
                placeholder="WhatsApp Number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#004AAD] focus:outline-none text-lg" 
              />
            </div>
            <button 
              disabled={!email.includes('@') || phone.length < 10 || isSubmitting}
              onClick={submitLeadDetails}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${email.includes('@') && phone.length >= 10 ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Unlock My Free Report'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-6">By continuing, you agree to ACET's Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    );
  }

  return null;
}