"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Timer, ChevronRight, LogIn, ClipboardCheck, CheckCircle2, AlertCircle 
} from "lucide-react";
import Image from "next/image";

type ViewState = 'LOGIN' | 'INSTRUCTIONS' | 'TESTING' | 'COMPLETED';

export function StudentPortal() {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [acetId, setAcetId] = useState('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const totalQuestions = 60;

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'TESTING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && view === 'TESTING') {
      setView('COMPLETED');
    }
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      setView('COMPLETED');
    }
  };

  // --- LOGIN VIEW ---
  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-body">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image 
                src="/logo.png" 
                alt="ACET Logo" 
                width={200} 
                height={50} 
                className="h-12 w-auto object-contain mix-blend-multiply" 
              />
            </div>
            <CardTitle className="text-2xl font-headline font-bold text-gray-800">Student Access</CardTitle>
            <CardDescription>Enter your credentials to begin your assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Enter ACET ID</label>
              <Input 
                placeholder="e.g. ACET-12345" 
                value={acetId} 
                onChange={(e) => setAcetId(e.target.value)}
                className="h-12 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Class</label>
              <Select onValueChange={setStudentClass}>
                <SelectTrigger className="h-12 border-gray-300">
                  <SelectValue placeholder="JSS 3 or SSS 3" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSS3">JSS 3</SelectItem>
                  <SelectItem value="SSS3">SSS 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-12 text-lg font-bold bg-[#004AAD] hover:bg-blue-800 transition-all shadow-md"
              onClick={() => setView('INSTRUCTIONS')}
              disabled={!acetId || !studentClass}
            >
              <LogIn className="mr-2" size={20} /> Start Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- INSTRUCTIONS VIEW ---
  if (view === 'INSTRUCTIONS') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-body">
        <Card className="w-full max-w-2xl shadow-2xl border-none">
          <CardHeader className="border-b pb-6">
            <div className="flex items-center gap-3 text-[#004AAD]">
              <ClipboardCheck size={32} />
              <div>
                <CardTitle className="text-2xl font-headline font-bold">Assessment Instructions</CardTitle>
                <p className="text-gray-500">Please read carefully before starting.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-8 space-y-6">
            <div className="grid gap-4">
              <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <Timer className="text-blue-600 shrink-0" />
                <p className="text-blue-900 font-medium">Timing: You have exactly 60 minutes to complete 60 questions.</p>
              </div>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <p><strong>Do NOT refresh</strong> the page or use the browser's back button.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <p>Each question has only <strong>one correct answer</strong>. Select carefully.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <p>The system tracks your progress. Unanswered questions count as zero.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                  <p>The test will <strong>automatically submit</strong> when the timer reaches zero.</p>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t p-6 flex justify-between items-center">
            <p className="text-sm text-gray-500 italic">Testing Level: {studentClass}</p>
            <Button 
              size="lg" 
              className="bg-[#004AAD] hover:bg-blue-800 font-bold px-8 shadow-lg"
              onClick={() => setView('TESTING')}
            >
              Begin Assessment <ChevronRight className="ml-2" size={20} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- TESTING VIEW ---
  if (view === 'TESTING') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 border-b px-6 flex items-center justify-between bg-white z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Image 
              src="/logo.png" 
              alt="ACET Logo" 
              width={150} 
              height={40} 
              className="h-8 w-auto object-contain mix-blend-multiply" 
            />
            <span className="h-6 w-px bg-gray-300 hidden sm:block"></span>
            <span className="font-headline font-bold text-gray-600 uppercase tracking-tighter text-sm hidden sm:block">ACET Platform</span>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono font-bold text-lg ${
            timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-[#004AAD] border-gray-100'
          }`}>
            <Timer size={20} />
            {formatTime(timeLeft)}
          </div>
        </header>

        {/* PROGRESS BAR */}
        <div className="w-full">
          <div className="h-1.5 w-full bg-gray-100">
            <div 
              className="h-full bg-[#38BDF8] transition-all duration-500 ease-out" 
              style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            ></div>
          </div>
          <div className="px-6 py-2 bg-gray-50 border-b flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>Question {currentQuestion} of {totalQuestions}</span>
            <span className="text-[#004AAD] bg-blue-50 px-2 py-0.5 rounded">Aptitude Segment</span>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col container mx-auto max-w-4xl px-6 py-12">
          {/* QUESTION AREA */}
          <div className="mb-12">
            <h2 className="text-3xl font-headline font-bold text-gray-800 leading-snug">
              Analyze the sequence of boxes below. Based on the quantitative progression of the elements, which of the provided options correctly continues the pattern?
            </h2>
          </div>

          {/* OPTIONS AREA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedOption(option)}
                className={`flex items-center gap-4 p-6 text-left border-2 rounded-xl transition-all group ${
                  selectedOption === option 
                    ? 'border-[#004AAD] bg-blue-50 ring-2 ring-blue-100' 
                    : 'border-gray-200 hover:border-[#38BDF8] hover:bg-sky-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shrink-0 ${
                  selectedOption === option 
                    ? 'bg-[#004AAD] text-white' 
                    : 'bg-gray-100 text-gray-500 group-hover:bg-[#38BDF8] group-hover:text-white'
                }`}>
                  {option}
                </div>
                <span className="text-lg font-medium text-gray-700">Sample answer text for logical deduction placeholder.</span>
              </button>
            ))}
          </div>
        </main>

        {/* BOTTOM BAR */}
        <footer className="h-20 border-t bg-white px-6 flex items-center justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button 
            size="lg" 
            className={`h-12 px-10 font-bold transition-all shadow-md ${
              selectedOption 
                ? 'bg-[#004AAD] hover:bg-blue-800 scale-105' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
            }`}
            disabled={!selectedOption}
            onClick={handleNextQuestion}
          >
            {currentQuestion === totalQuestions ? 'Submit Assessment' : 'Next Question'}
            <ChevronRight className="ml-2" size={20} />
          </Button>
        </footer>
      </div>
    );
  }

  // --- COMPLETED VIEW ---
  if (view === 'COMPLETED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-body">
        <Card className="w-full max-w-md shadow-2xl border-none text-center p-6">
          <CardHeader className="pt-10">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                <CheckCircle2 size={56} />
              </div>
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-gray-800">Assessment Complete</CardTitle>
            <CardDescription className="text-lg mt-2">Your responses have been securely synced.</CardDescription>
          </CardHeader>
          <CardContent className="pb-10">
            <p className="text-gray-600 mb-8 leading-relaxed">
              Great job! Your ACET assessment has been successfully recorded. Your detailed performance analytics will be available to your school administration shortly.
            </p>
            <Button 
              variant="outline" 
              className="w-full h-12 font-bold border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => window.location.reload()}
            >
              Finish & Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}