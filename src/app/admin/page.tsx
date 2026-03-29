import React from 'react';
import { BulkUserUpload } from '@/components/portal/admin/bulk-user-upload';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage students and generate ACET access codes for Roseville School.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Student Code Generator</h2>
          {/* This is the engine we fixed earlier! */}
          <BulkUserUpload /> 
        </div>

      </div>
    </div>
  );
}