"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

// A mock question so we can see the UI working immediately
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    text: 'If a train travels 60km in 45 minutes, what is its speed in km/h?',
    options: ['80 km/h', '75 km/h', '90 km/h', '100 km/h']
  },
  {
    id: 'q2',
    text: 'Which of the following logically completes the pattern?',
    options: ['Option A', 'Option B', 'Option C', 'Option D']
  }
];

export function TestingEngine() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // --- ENGINE 1: The Countdown Timer (e.g., 60 minutes) ---
  const [timeLeft, setTimeLeft] = useState(3600); 
  
  // --- ENGINE 2: The Micro-Stopwatch ---
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [studentAnswers, setStudentAnswers] = useState<any[]>([]);

  // --- ENGINE 3: Behavioral Lockdown (Anti-Cheat) ---
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const currentQuestion = MOCK_QUESTIONS[currentIndex];

  // 1. Overall Test Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Tab-Switching Detection Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStrikes((prev) => prev + 1);
        setShowWarning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Format the time left into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleNext = () => {
    if (!selectedOption) return;

    // Calculate exact time spent on this specific question
    const timeSpentOnQuestion = (Date.now() - questionStartTime) / 1000;

    // Save the data payload
    const answerData = {
      questionId: currentQuestion.id,
      selectedOption,
      timeSpentSeconds: timeSpentOnQuestion
    };
    
    setStudentAnswers(prev => [...prev, answerData]);
    console.log("Data Logged:", answerData); // You can view this in your browser console!

    // Move to next question or finish
    if (currentIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setQuestionStartTime(Date.now()); // Reset stopwatch for the new question
    } else {
      alert("Test Complete! Processing metrics...");
      console.log("Final Secure Payload:", [...studentAnswers, answerData]);
    }
  };

  return (
    // We disable copying, pasting, and right-clicking on the entire testing wrapper
    <div 
      className="min-h-screen bg-gray-50 flex flex-col font-sans select-none"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* ANTI-CHEAT WARNING MODAL */}
      {showWarning && (
        <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl">
            <ShieldAlert size={64} className="text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Security Warning</h2>
            <p className="text-gray-600 mb-6">
              You have left the testing environment. This action has been recorded. 
              Further violations will result in an invalid assessment score.
            </p>
            <p className="text-sm font-bold text-red-600 mb-6">Strikes Recorded: {strikes}</p>
            <button 
              onClick={() => setShowWarning(false)}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors w-full"
            >
              I Understand, Return to Test
            </button>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm">
        <div className="font-black text-xl tracking-wider text-[#004AAD]">
          ACET <span className="text-[#38BDF8]">PLATFORM</span>
        </div>
        
        {/* THE TICKING TIMER */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg border ${
          timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </header>

      {/* MAIN TESTING AREA */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
        
        {/* PROGRESS BAR */}
        <div className="w-full mb-8">
          <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
            <span>Question {currentIndex + 1} of {MOCK_QUESTIONS.length}</span>
            <span>{Math.round(((currentIndex) / MOCK_QUESTIONS.length) * 100)}% Completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-[#38BDF8] h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${((currentIndex) / MOCK_QUESTIONS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* QUESTION CARD */}
        <div className="bg-white w-full rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-6">
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed">
            {currentQuestion.text}
          </h2>
        </div>

        {/* OPTIONS GRID */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const letters = ['A', 'B', 'C', 'D'];
            return (
              <button
                key={idx}
                onClick={() => setSelectedOption(option)}
                className={`flex items-center gap-4 p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected 
                    ? 'border-[#004AAD] bg-blue-50 shadow-md transform scale-[1.01]' 
                    : 'border-gray-200 bg-white hover:border-[#38BDF8] hover:bg-sky-50'
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg ${
                  isSelected ? 'bg-[#004AAD] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {letters[idx]}
                </div>
                <span className={`font-medium text-lg ${isSelected ? 'text-[#004AAD]' : 'text-gray-700'}`}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="w-full flex justify-end border-t border-gray-200 pt-6 mt-auto">
          <button
            onClick={handleNext}
            disabled={!selectedOption}
            className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${
              selectedOption 
                ? 'bg-[#004AAD] text-white hover:bg-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentIndex === MOCK_QUESTIONS.length - 1 ? 'Submit Assessment' : 'Next Question'}
          </button>
        </div>

      </main>
    </div>
  );
}