'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

// 1. The 10-Question Data Model
const NANO_QUESTIONS = [
  { id: 1, text: "How do you typically handle tight deadlines?", options: ["I plan ahead", "I work best under pressure", "I ask for extensions", "I delegate tasks"] },
  { id: 2, text: "What is your primary learning style?", options: ["Visual", "Auditory", "Reading/Writing", "Kinesthetic (Hands-on)"] },
  { id: 3, text: "How do you approach a complex problem?", options: ["Break it into smaller parts", "Research existing solutions", "Brainstorm with a team", "Jump in and test things"] },
  { id: 4, text: "Which environment do you prefer working in?", options: ["Quiet and isolated", "Busy and collaborative", "Structured office", "Flexible remote"] },
  { id: 5, text: "How do you handle constructive criticism?", options: ["Implement it immediately", "Ask for specific examples", "Take time to process it", "Defend my original work"] },
  { id: 6, text: "What motivates you the most?", options: ["Achieving goals", "Learning new skills", "Helping others", "Financial reward"] },
  { id: 7, text: "How do you prioritize multiple tasks?", options: ["Urgency and importance", "First in, first out", "Easiest to hardest", "Hardest to easiest"] },
  { id: 8, text: "What is your communication style?", options: ["Direct and concise", "Detailed and thorough", "Casual and friendly", "Formal and structured"] },
  { id: 9, text: "How do you react to unexpected changes?", options: ["Adapt quickly", "Create a new plan", "Seek guidance", "Resist initially"] },
  { id: 10, text: "Where do you see your career in 5 years?", options: ["Leadership role", "Technical expert", "Starting my own business", "Exploring a new field"] },
];

export default function NanoTest() {
  // 2. The Memory (State)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = NANO_QUESTIONS[currentIndex];
  const progressPercentage = ((currentIndex + 1) / NANO_QUESTIONS.length) * 100;

  // 3. The Logic
  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const handleNext = () => {
    if (currentIndex < NANO_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = () => {
    setIsSubmitting(true);
    // 🕵️ DEBUG: Let's see the packaged data in the console!
    console.log("FINAL PACKAGED DATA FOR PAYMENT/AI:", answers);
    
    // TODO: In Pillar 2, we will replace this alert with a redirect to the Payment Gateway!
    setTimeout(() => {
      alert("Test Complete! Ready to hand off to Payment Gateway.");
      setIsSubmitting(false);
    }, 1000);
  };

  // 4. The UI
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
            <span>Question {currentIndex + 1} of {NANO_QUESTIONS.length}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-[#004AAD] h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12">
          <h2 className="text-2xl font-black text-gray-900 mb-8">
            {currentQuestion.text}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${
                    isSelected 
                      ? 'border-[#004AAD] bg-[#004AAD]/5 text-[#004AAD]' 
                      : 'border-gray-200 text-gray-700 hover:border-[#004AAD]/30 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 font-bold text-gray-500 hover:text-gray-900 disabled:opacity-0 transition-all"
            >
              <ArrowLeft size={18} /> Back
            </button>

            {currentIndex === NANO_QUESTIONS.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={!answers[currentQuestion.id] || isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isSubmitting ? 'Processing...' : 'Complete & Get Report'} <CheckCircle size={18} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className="flex items-center gap-2 px-8 py-3 bg-[#004AAD] text-white rounded-xl font-bold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                Next <ArrowRight size={18} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}