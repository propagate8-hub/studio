"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Mail, GraduationCap, ArrowRight, BrainCircuit, Lock, Phone, Loader2, CheckCircle } from 'lucide-react';

// 🔥 FIREBASE IMPORTS
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase'; 

export default function MarketingDemo() {
  // --- NEW FUNNEL STAGES ---
  const [stage, setStage] = useState<'LOBBY' | 'REGISTRATION' | 'TESTING' | 'ANALYZING' | 'RESULTS'>('LOBBY');
  const [classLevel, setClassLevel] = useState<'JSS 3' | 'SSS 3' | null>(null);
  
  // Database States
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Testing States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  // Lead Capture States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hasConsented, setHasConsented] = useState(false); // 🔥 NEW STATE
  
  // --- DATA INTEGRITY REGEX ---
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = /^\+?[0-9]{10,15}$/.test(phone);

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
  // PIPELINE 1: PULL QUESTIONS & START
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
      // Automatically save to DB and move to results after 3 seconds
      setTimeout(() => {
        submitLeadDetails();
      }, 3000);
    }
  };

  // ==========================================
  // PIPELINE 2: AUTO-PUSH TO FIREBASE
  // ==========================================
  const submitLeadDetails = async () => {
    try {
      await addDoc(collection(db, 'Marketing_Leads'), {
        email,
        phone,
        classLevel,
        antiCheatStrikes: strikes,
        completedAt: serverTimestamp(),
        source: 'Free_Nano_Demo'
      });
      setStage('RESULTS'); // Move to the final blurred screen
    } catch (error) {
      console.error("Failed to save lead:", error);
      alert("There was an error generating your final report.");
    }
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
            <button 
              onClick={() => { setClassLevel('JSS 3'); setStage('REGISTRATION'); }} 
              className="p-8 rounded-2xl border-2 text-left bg-white hover:border-[#004AAD] hover:shadow-lg transition-all"
            >
              <GraduationCap size={40} className="mb-4 text-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900">JSS 3 Cohort</h3>
              <p className="text-gray-500 mt-2">Transitioning to Senior Secondary</p>
            </button>
            <button 
              onClick={() => { setClassLevel('SSS 3'); setStage('REGISTRATION'); }} 
              className="p-8 rounded-2xl border-2 text-left bg-white hover:border-[#004AAD] hover:shadow-lg transition-all"
            >
              <GraduationCap size={40} className="mb-4 text-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900">SSS 3 Cohort</h3>
              <p className="text-gray-500 mt-2">Preparing for WAEC & JAMB</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PARENT REGISTRATION (MOVED TO FRONT!)
  // ==========================================
  if (stage === 'REGISTRATION') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Where should we send the results?</h2>
          <p className="text-gray-600 mb-8">
            Register below, then hand the device to your child to begin the {classLevel} Nano-Assessment.
          </p>

          <div className="space-y-4 text-left">
            <div>
              <div className="relative">
                <Mail className={`absolute left-4 top-4 ${email.length > 0 ? (isEmailValid ? 'text-green-500' : 'text-red-500') : 'text-gray-400'}`} size={20} />
                <input 
                  type="email" 
                  placeholder="Parent Email Address" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 focus:outline-none text-lg transition-colors ${email.length > 0 && !isEmailValid ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#004AAD]'}`} 
                />
              </div>
              {email.length > 0 && !isEmailValid && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">Please enter a valid email address.</p>}
            </div>

            <div>
              <div className="relative">
                <Phone className={`absolute left-4 top-4 ${phone.length > 0 ? (isPhoneValid ? 'text-green-500' : 'text-red-500') : 'text-gray-400'}`} size={20} />
                <input 
                  type="tel" 
                  placeholder="WhatsApp Number (e.g. 080123...)" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 focus:outline-none text-lg transition-colors ${phone.length > 0 && !isPhoneValid ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#004AAD]'}`} 
                />
              </div>
              {phone.length > 0 && !isPhoneValid && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">Must be a valid 10-15 digit number.</p>}
            </div>

            {/* 🔥 THE LEGAL GUARDRAIL CHECKBOX */}
            <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 text-left">
              <input 
                type="checkbox" 
                id="legal-consent"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-[#004AAD] focus:ring-[#004AAD]"
              />
              <label htmlFor="legal-consent" className="text-xs text-gray-700 leading-relaxed">
  <span className="font-bold text-[#004AAD]">MANDATORY CONSENT:</span> I am the legal parent/guardian of this student. I have read and agree to the Propagate Digital{' '}
  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#004AAD] underline hover:text-blue-800">
    Terms of Service
  </a>{' '}
  and{' '}
  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#004AAD] underline hover:text-blue-800">
    Privacy Policy
  </a>. 
  I expressly authorize Propagate Digital to process my child’s academic and cognitive data for the ACET Diagnostic Report in compliance with the NDPA 2023.
</label>
            </div>

            <button 
              // 🔥 Button is now locked unless ALL THREE conditions are met!
              disabled={!isEmailValid || !isPhoneValid || !hasConsented || isLoading}
              onClick={startDemo}
              className={`w-full py-4 mt-6 rounded-xl font-black text-lg transition-all flex justify-center items-center gap-2 ${isEmailValid && isPhoneValid && hasConsented ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Start Assessment'}
            </button>
          </div>
          <button onClick={() => setStage('LOBBY')} className="text-sm text-gray-500 mt-6 hover:text-[#004AAD]">← Back to Class Selection</button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: TESTING ENGINE
  // ==========================================
  if (stage === 'TESTING' && questions.length > 0) {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };
    
    const currentQ = questions[currentIndex];
    
    // THE INDESTRUCTIBLE PARSER
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
            {currentQ.image_url && <img src={currentQ.image_url} alt="Cognitive Visual" className="max-h-64 mx-auto mb-6 rounded-lg object-contain" />}
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
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${selectedOption ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: ANALYZING
  // ==========================================
  if (stage === 'ANALYZING') {
    return (
      <div className="min-h-screen bg-[#004AAD] flex flex-col items-center justify-center text-white p-6 text-center">
        <BrainCircuit size={80} className="animate-pulse mb-8 text-[#38BDF8]" />
        <h2 className="text-3xl font-black mb-4">Analyzing Cognitive Velocity...</h2>
        <p className="text-blue-200 text-lg">Saving results and generating Parent Report.</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 5: THE RESULTS (PAYWALL)
  // ==========================================
  if (stage === 'RESULTS') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Test Complete!</h2>
          <p className="text-gray-600 mb-8">
            The full {classLevel} Cognitive Profile is being sent to your parent's WhatsApp and Email right now.
          </p>
          
          <div className="bg-gray-100 p-6 rounded-2xl relative overflow-hidden mb-8">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] flex flex-col items-center justify-center z-10">
              <Lock className="text-[#004AAD] mb-2" size={28} />
              <span className="font-bold text-gray-800">Results Locked</span>
            </div>
            {/* Fake Blurred content behind the lock */}
            <div className="space-y-3 opacity-40">
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              <div className="h-8 bg-[#004AAD] rounded w-full mt-4"></div>
            </div>
          </div>

          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 rounded-xl font-black text-lg bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
}