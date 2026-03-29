"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 

export default function QuestionAudit() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    const fetchAllQuestions = async () => {
      try {
        const qSnap = await getDocs(collection(db, 'Assessments_Bank'));
        const allDocs = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setQuestions(allDocs);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllQuestions();
  }, []);

  // Extract unique categories for the filter dropdown
  const categories = Array.from(new Set(questions.map(q => q.category).filter(Boolean))) as string[];
  
  const filteredQuestions = categoryFilter === 'ALL' 
    ? questions 
    : questions.filter(q => q.category === categoryFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-[#004AAD]">
        <Loader2 size={48} className="animate-spin mb-4" />
        <h2 className="text-xl font-bold">Syncing Live Question Bank...</h2>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Database QA Audit</h1>
          <p className="text-gray-500 font-medium mt-1">Reviewing {filteredQuestions.length} live questions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Filter Category:</span>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-100 border-none rounded-lg font-bold text-[#004AAD] focus:ring-2 focus:ring-[#004AAD] outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredQuestions.map((q, index) => {
          // Fallback parser for options
          let optionsList = [];
          if (Array.isArray(q.options)) optionsList = q.options;
          else if (typeof q.options === 'string') optionsList = q.options.split(',').map((s: string) => s.trim());
          else if (typeof q.options === 'object') optionsList = Object.values(q.options);

          return (
            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-4">
              
              {/* Question Metadata Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold font-mono">ID: {q.id}</span>
                  <span className="bg-blue-50 text-[#004AAD] px-3 py-1 rounded-md text-xs font-bold">{q.category || 'Uncategorized'}</span>
                  {q.difficulty_level && (
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-md text-xs font-bold">Level: {q.difficulty_level}</span>
                  )}
                </div>
                {(!optionsList || optionsList.length === 0) && (
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-md text-xs font-bold">
                    <AlertTriangle size={14} /> Missing Options Array
                  </span>
                )}
              </div>

              {/* Image Preview (If exists) */}
              {q.image_url && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-bold mb-2 w-full"><ImageIcon size={16}/> Attached Visual</div>
                  <img src={q.image_url} alt="Question Visual" className="max-h-48 object-contain rounded-lg shadow-sm" />
                </div>
              )}

              {/* Question Text */}
              <h3 className="text-xl font-medium text-gray-900">
                <span className="font-black text-gray-400 mr-2">{index + 1}.</span> 
                {q.question || q.question_text || q.text || "⚠️ NO QUESTION TEXT FOUND"}
              </h3>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {optionsList.length > 0 ? optionsList.map((opt: string, i: number) => {
                  const isCorrect = String(opt).trim() === String(q.correct_answer || q.correctAnswer || q.answer).trim();
                  return (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg border-2 text-sm font-medium flex items-center justify-between ${isCorrect ? 'border-green-500 bg-green-50 text-green-900' : 'border-gray-100 bg-white text-gray-600'}`}
                    >
                      <span>{String(opt)}</span>
                      {isCorrect && <CheckCircle size={16} className="text-green-600" />}
                    </div>
                  );
                }) : (
                  <div className="col-span-2 p-3 bg-gray-50 text-gray-500 italic rounded-lg text-sm border border-gray-100">
                    Likert Scale Fallback (Strongly Agree - Strongly Disagree) will be used.
                  </div>
                )}
              </div>

              {/* Rationale (If exists) */}
              {q.rationale && (
                <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                  <span className="font-bold">Rationale: </span>{q.rationale}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}