"use client";

import React from 'react';
import { 
  LayoutDashboard, Users, FileText, BarChart, Settings, 
  LogOut, User, WifiOff, CheckCircle, ClipboardList 
} from 'lucide-react';

// --- 1. THE LAYOUT COMPONENT ---
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#004AAD] text-white flex flex-col">
        <div className="p-6 text-2xl font-bold tracking-wider border-b border-blue-800">
          PROPAGATE
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 p-3 bg-blue-800 rounded-lg text-white">
            <LayoutDashboard size={20} /> Overview
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-blue-800 rounded-lg transition-colors">
            <Users size={20} /> Student Roster
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-blue-800 rounded-lg transition-colors">
            <FileText size={20} /> Test Management
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-blue-800 rounded-lg transition-colors">
            <BarChart size={20} /> AI Reports
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-blue-800 rounded-lg transition-colors">
            <Settings size={20} /> School Settings
          </a>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <div className="font-semibold text-lg text-gray-700">
            Greensprings College
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Online
            </div>
            <div className="flex items-center gap-3 pl-6 border-l">
              <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                <User size={20} />
              </div>
              <button className="text-gray-500 hover:text-red-600 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// --- 2. THE OVERVIEW TAB ---
export function DashboardHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here is the latest ACET testing data.</p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Enrolled</p>
            <h3 className="text-3xl font-bold text-gray-800">120</h3>
          </div>
          <div className="p-3 bg-blue-50 text-[#004AAD] rounded-lg">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Tests Completed</p>
            <h3 className="text-3xl font-bold text-gray-800">85</h3>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-amber-600 font-medium mb-1">Pending Sync</p>
            <h3 className="text-3xl font-bold text-amber-600">12</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <WifiOff size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Reports Generated</p>
            <h3 className="text-3xl font-bold text-gray-800">45</h3>
          </div>
          <div className="p-3 bg-[#e0f2fe] text-[#38BDF8] rounded-lg">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Recent Test Submissions</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Student Name</th>
              <th className="p-4 font-medium">Class</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((item) => (
              <tr key={item} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-800 font-medium">Student Placeholder {item}</td>
                <td className="p-4 text-gray-500">JSS 3</td>
                <td className="p-4">
                  <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Synced</span>
                </td>
                <td className="p-4 text-gray-500">Just now</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}