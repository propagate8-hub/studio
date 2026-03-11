"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Mail, GraduationCap, ArrowRight, BrainCircuit, Lock, Phone, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// 🔥 FIREBASE IMPORTS
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 

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
    if (!classLevel) return;
    setIsLoading(true);
    try {
      const qSnap = await getDocs(collection(db, 'Assessments_Bank'));
      const allDocs = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Shuffle the entire database and pick exactly 10
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
    if (!email || !phone) return;
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
      console.error("Submission failed:", error);
      alert("Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (stage === 'LOBBY') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <BrainCircuit className="text-primary w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Experience ACET Nano</CardTitle>
            <CardDescription className="text-lg">Try a 10-question adaptive demo of our testing engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setClassLevel('JSS 3')}
                className={`p-6 border-2 rounded-xl text-left transition-all ${classLevel === 'JSS 3' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-200 hover:border-primary/50'}`}
              >
                <GraduationCap className={`w-8 h-8 mb-2 ${classLevel === 'JSS 3' ? 'text-primary' : 'text-slate-400'}`} />
                <p className="font-bold text-lg">JSS 3</p>
                <p className="text-sm text-slate-500">Junior Secondary</p>
              </button>
              <button 
                onClick={() => setClassLevel('SSS 3')}
                className={`p-6 border-2 rounded-xl text-left transition-all ${classLevel === 'SSS 3' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-200 hover:border-primary/50'}`}
              >
                <GraduationCap className={`w-8 h-8 mb-2 ${classLevel === 'SSS 3' ? 'text-primary' : 'text-slate-400'}`} />
                <p className="font-bold text-lg">SSS 3</p>
                <p className="text-sm text-slate-500">Senior Secondary</p>
              </button>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              size="lg" 
              className="w-full h-14 text-xl font-bold" 
              disabled={!classLevel || isLoading}
              onClick={startDemo}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2" />}
              Start Free Demo
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (stage === 'TESTING') {
    const q = questions[currentIndex];
    return (
      <div className="min-h-screen bg-white flex flex-col font-body">
        {showWarning && (
          <div className="fixed inset-0 bg-red-900/95 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl">
              <ShieldAlert size={64} className="text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Security Warning</h2>
              <p className="text-slate-600 mb-6">
                You switched tabs. Our AI behavioral monitor has logged this event. 
                In a real assessment, this could invalidate your results.
              </p>
              <Button variant="destructive" className="w-full" onClick={() => setShowWarning(false)}>
                I Understand, Return to Test
              </Button>
            </div>
          </div>
        )}

        <header className="h-16 border-b px-6 flex items-center justify-between">
          <div className="font-bold text-xl text-primary">ACET <span className="text-secondary">NANO</span></div>
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg font-mono font-bold">
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
        </header>

        <Progress value={(currentIndex / questions.length) * 100} className="h-1 rounded-none" />

        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
          <div className="mb-8">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">
              {q?.category || 'General'}
            </span>
            <h2 className="text-2xl font-headline font-bold mt-4 leading-snug">
              {q?.text || 'Loading question...'}
            </h2>
          </div>

          <div className="grid gap-3">
            {q?.options?.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedOption(opt)}
                className={`p-5 text-left border-2 rounded-xl transition-all flex items-center gap-4 ${
                  selectedOption === opt ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold ${
                  selectedOption === opt ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                {opt}
              </button>
            ))}
          </div>
        </main>

        <footer className="h-20 border-t flex items-center justify-end px-6 bg-slate-50">
          <Button 
            size="lg" 
            disabled={!selectedOption} 
            onClick={handleNextQuestion}
            className="px-8 font-bold"
          >
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
          </Button>
        </footer>
      </div>
    );
  }

  if (stage === 'ANALYZING') {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="text-center text-white space-y-6">
          <Loader2 className="w-16 h-16 animate-spin mx-auto opacity-50" />
          <h2 className="text-3xl font-headline font-bold">Analyzing Your Responses...</h2>
          <div className="space-y-2 opacity-80 max-w-sm">
            <p className="animate-pulse">Checking cognitive speed metrics</p>
            <p className="animate-pulse delay-75">Evaluating adaptive difficulty stabilization</p>
            <p className="animate-pulse delay-150">Generating focus-integrity score</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'LEAD_CAPTURE') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-none">
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-600 w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Analysis Ready!</CardTitle>
            <CardDescription className="text-lg">
              We've calculated your preliminary aptitude profile. Where should we send the full AI report?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  type="email" 
                  placeholder="parent@example.com" 
                  className="pl-10 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Phone Number (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  type="tel" 
                  placeholder="0803..." 
                  className="pl-10 h-12"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {strikes > 0 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 mt-4">
                <AlertTriangle className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800">
                  Note: <strong>{strikes} focus strikes</strong> detected. This behavior data is included in your integrity analysis.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-4">
            <Button 
              size="lg" 
              className="w-full h-14 text-xl font-bold shadow-lg"
              disabled={!email || !phone || isSubmitting}
              onClick={submitLeadDetails}
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Lock className="mr-2" />}
              Unlock AI Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}
