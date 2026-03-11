"use client";
import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Mail, GraduationCap, ArrowRight, BrainCircuit, Lock, Phone } from 'lucide-react';

// MOCK DATA (We will connect this to Firebase next)
const DEMO_QUESTIONS = [
  { id: 'q1', text: 'If a train travels 60km in 45 minutes, what is its speed in km/h?', options: ['80 km/h', '75 km/h', '90 km/h', '100 km/h'] },
  { id: 'q2', text: 'Which of the following logically completes the pattern?', options: ['Option A', 'Option B', 'Option C', 'Option D'] },
  { id: 'q3', text: 'Find the odd one out among the following words.', options: ['Apple', 'Banana', 'Carrot', 'Mango'] }
];

export default function MarketingDemo() {
  // --- FUNNEL STATE ---
  const [stage, setStage] = useState<'LOBBY' | 'TESTING' | 'ANALYZING' | 'LEAD_CAPTURE'>('LOBBY');
  const [classLevel, setClassLevel] = useState<'JSS 3' | 'SSS 3' | null>(null);
  
  // --- TESTING STATE ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5-minute teaser!
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // --- LEAD CAPTURE STATE ---
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // 1. Timer Logic (Only runs during TESTING)
  useEffect(() => {
    let timer: any;
    if (stage === 'TESTING') {
      timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [stage]);

  // 2. Anti-Cheat Logic (Only runs during TESTING)
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

  const handleNextQuestion = () => {
    if (currentIndex < DEMO_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Test finished! Move to the analyzing animation
      setStage('ANALYZING');
      setTimeout(() => setStage('LEAD_CAPTURE'), 3000); // Fake a 3-second analysis delay
    }
  };

  // ==========================================
  // VIEW 1: THE LOBBY
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
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Take our 5-minute diagnostic test to see a preview of the ACET Methodology. Select the student's current academic level to begin.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <button 
              onClick={() => setClassLevel('JSS 3')}
              className={`p-8 rounded-2xl border-2 text-left transition-all ${classLevel === 'JSS 3' ? 'border-[#004AAD] bg-blue-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <GraduationCap size={40} className={classLevel === 'JSS 3' ? 'text-[#004AAD]' : 'text-gray-400'} />
              <h3 className="text-2xl font-bold text-gray-900 mt-4">JSS 3 Cohort</h3>
              <p className="text-gray-500 mt-2">Transitioning to Senior Secondary</p>
            </button>

            <button 
              onClick={() => setClassLevel('SSS 3')}
              className={`p-8 rounded-2xl border-2 text-left transition-all ${classLevel === 'SSS 3' ? 'border-[#004AAD] bg-blue-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <GraduationCap size={40} className={classLevel === 'SSS 3' ? 'text-[#004AAD]' : 'text-gray-400'} />
              <h3 className="text-2xl font-bold text-gray-900 mt-4">SSS 3 Cohort</h3>
              <p className="text-gray-500 mt-2">Preparing for WAEC & JAMB</p>
            </button>
          </div>

          <button 
            disabled={!classLevel}
            onClick={() => setStage('TESTING')}
            className={`mt-12 px-12 py-5 rounded-full font-black text-xl flex items-center gap-3 mx-auto transition-all ${classLevel ? 'bg-[#004AAD] text-white hover:bg-blue-800 hover:shadow-2xl hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Start 5-Minute Demo <ArrowRight />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE TESTING ENGINE (Locked Down)
  // ==========================================
  if (stage === 'TESTING') {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col select-none" onCopy={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}>
        
        {showWarning && (
          <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md text-center">
              <ShieldAlert size={64} className="text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-2">Security Warning</h2>
              <p className="text-gray-600 mb-6">You have left the testing window. Strikes: {strikes}</p>
              <button onClick={() => setShowWarning(false)} className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold w-full">Return to Test</button>
            </div>
          </div>
        )}

        <header className="bg-white border-b h-16 flex items-center justify-between px-8">
          <div className="font-bold text-gray-500">{classLevel} Demo Assessment</div>
          <div className="flex items-center gap-2 font-mono font-bold text-lg text-red-600 bg-red-50 px-4 py-1 rounded-md">
            <Clock size={20} /> {formatTime(timeLeft)}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center p-8 max-w-4xl mx-auto w-full">
          <div className="w-full mb-8 bg-gray-200 rounded-full h-2">
            <div className="bg-[#38BDF8] h-2 rounded-full transition-all" style={{ width: `${((currentIndex) / DEMO_QUESTIONS.length) * 100}%` }}></div>
          </div>

          <div className="bg-white w-full rounded-2xl shadow-sm border p-12 mb-6">
            <h2 className="text-2xl font-medium text-gray-900">{DEMO_QUESTIONS[currentIndex].text}</h2>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {DEMO_QUESTIONS[currentIndex].options.map((option, idx) => (
              <button key={idx} onClick={() => setSelectedOption(option)} className={`p-6 rounded-xl border-2 text-left font-medium text-lg ${selectedOption === option ? 'border-[#004AAD] bg-blue-50 text-[#004AAD]' : 'border-gray-200 bg-white'}`}>
                {option}
              </button>
            ))}
          </div>

          <div className="w-full flex justify-end mt-auto">
            <button disabled={!selectedOption} onClick={handleNextQuestion} className={`px-10 py-4 rounded-xl font-bold text-lg ${selectedOption ? 'bg-[#004AAD] text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400'}`}>
              {currentIndex === DEMO_QUESTIONS.length - 1 ? 'Analyze Results' : 'Next Question'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: THE ANALYZING ANIMATION
  // ==========================================
  if (stage === 'ANALYZING') {
    return (
      <div className="min-h-screen bg-[#004AAD] flex flex-col items-center justify-center text-white p-6">
        <BrainCircuit size={80} className="animate-pulse mb-8 text-[#38BDF8]" />
        <h2 className="text-3xl font-black mb-4">Analyzing Cognitive Velocity...</h2>
        <p className="text-blue-200 text-lg">Cross-referencing your {classLevel} baseline with 50,000+ data points.</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: THE LEAD CAPTURE GATE
  // ==========================================
  if (stage === 'LEAD_CAPTURE') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Report Generated!</h2>
          <p className="text-gray-600 mb-8">
            Your partial {classLevel} metrics are ready. Enter your details to unlock your Baseline Index score.
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
              // Button only unlocks if email is valid and phone has at least 10 digits
              disabled={!email.includes('@') || phone.length < 10}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${email.includes('@') && phone.length >= 10 ? 'bg-[#004AAD] text-white hover:bg-blue-800 hover:shadow-lg hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Unlock My Free Report
            </button>
          </div>
          
          <p className="text-xs text-gray-400 mt-6">By continuing, you agree to ACET's Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    );
  }

  return null;
}