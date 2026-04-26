'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

// Define the expected CSV row structure
interface CSVRow {
  'Student Name': string;
  'Class Level': string;
  'Overall Accuracy (%)': string;
  'Primary Recommendation': string;
  'Focus Area': string;
}

export default function SummaryReportGenerator() {
  const [data, setData] = useState<CSVRow[]>([]);
  const [schoolName, setSchoolName] = useState('Roseville Secondary School, Enugu');
  const printRef = useRef<HTMLDivElement>(null);

  // Parse CSV on file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Optional: Auto-detect school name from filename
      const extractedName = file.name.replace(/_Summary_Report\(\d*\)|\.csv|_/g, ' ').trim();
      if (extractedName) setSchoolName(extractedName);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data as CSVRow[]);
        },
      });
    }
  };

  // Data Aggregation Logic
  const totalStudents = data.length;
  const avgAccuracy = totalStudents > 0 
    ? data.reduce((acc, row) => acc + Number(row['Overall Accuracy (%)'] || 0), 0) / totalStudents 
    : 0;

  const primaryCounts: Record<string, number> = {};
  const focusCounts: Record<string, number> = {};

  data.forEach((row) => {
    const prim = row['Primary Recommendation'];
    const foc = row['Focus Area'];
    if (prim) primaryCounts[prim] = (primaryCounts[prim] || 0) + 1;
    if (foc) focusCounts[foc] = (focusCounts[foc] || 0) + 1;
  });

  // Sort primary counts to find the dominant track
  const sortedPrimary = Object.entries(primaryCounts).sort((a, b) => b[1] - a[1]);
  const topPrimaryStr = sortedPrimary.length > 0 ? sortedPrimary[0][0] : "N/A";
  const topPrimaryPct = totalStudents > 0 && sortedPrimary.length > 0 
    ? ((sortedPrimary[0][1] / totalStudents) * 100).toFixed(1) 
    : 0;

  // Find dominant focus area
  const sortedFocus = Object.entries(focusCounts).sort((a, b) => b[1] - a[1]);
  const topFocusStr = sortedFocus.length > 0 ? sortedFocus[0][0] : "N/A";

  // Get Top 5 Students
  const topStudents = [...data]
    .sort((a, b) => Number(b['Overall Accuracy (%)']) - Number(a['Overall Accuracy (%)']))
    .slice(0, 5);

  // Helper component for rendering horizontal bar charts
  const BarChart = ({ chartData, color }: { chartData: Record<string, number>, color: string }) => {
    const maxVal = Math.max(...Object.values(chartData), 1);
    return (
      <div>
        {Object.entries(chartData)
          .sort((a, b) => b[1] - a[1]) // Sort largest to smallest
          .map(([label, count]) => {
            const pctOfMax = (count / maxVal) * 100;
            const pctOfTotal = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
            return (
              <div key={label} style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#2c3e50', marginBottom: '3px' }}>
                  {label} <span style={{ color: '#7f8c8d', fontSize: '10pt', fontWeight: 'normal' }}>({count} students - {pctOfTotal.toFixed(1)}%)</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#ecf0f1', borderRadius: '4px', height: '22px', position: 'relative' }}>
                  <div style={{ width: `${pctOfMax}%`, backgroundColor: color, height: '100%', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
              </div>
            );
        })}
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Control Panel (Hidden during printing) */}
      <div className="max-w-4xl mx-auto mb-8 p-6 bg-white rounded-lg shadow-md print:hidden">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Generate Cohort Summary Report</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Summary CSV</label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-gray-300 rounded-md p-1"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name (Override)</label>
            <input 
              type="text" 
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <button 
            onClick={handlePrint}
            disabled={data.length === 0}
            className="px-6 py-2 bg-purple-700 text-white font-semibold rounded-md shadow disabled:opacity-50 hover:bg-purple-800 transition"
          >
            Save as PDF
          </button>
        </div>
      </div>

      {/* Actual Report Area */}
      {data.length > 0 && (
        <div ref={printRef} className="max-w-4xl mx-auto bg-[#fdfbf7] shadow-xl print:shadow-none print:w-full">
          
          {/* Internal Styles just for the report wrapper */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              .print-container, .print-container * { visibility: visible; }
              .print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
              .avoid-break { page-break-inside: avoid; }
              .page-break { page-break-before: always; }
              @page { size: A4; margin: 15mm; }
            }
          `}} />

          <div className="print-container text-[#2c3e50] font-sans p-10">
            
            {/* Header Banner */}
            <div className="bg-[#4a235a] text-white p-8 rounded-lg mb-8 relative">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Cohort Analytics & Specialization Report</h1>
              <p className="text-[#e8daef] text-lg">{schoolName} • ACET Psychometric Evaluation</p>
            </div>

            {/* KPIs */}
            <div className="flex gap-6 mb-8">
              <div className="flex-1 bg-white p-6 rounded-lg border-l-4 border-[#d35400] shadow-sm">
                <div className="text-4xl font-bold text-[#2c3e50] mb-1">{totalStudents}</div>
                <div className="text-xs text-[#7f8c8d] uppercase tracking-wider">Total Students Assessed</div>
              </div>
              <div className="flex-1 bg-white p-6 rounded-lg border-l-4 border-[#8e44ad] shadow-sm">
                <div className="text-4xl font-bold text-[#2c3e50] mb-1">{avgAccuracy.toFixed(1)}%</div>
                <div className="text-xs text-[#7f8c8d] uppercase tracking-wider">Average Cohort Accuracy</div>
              </div>
            </div>

            {/* Exec Summary */}
            <div className="bg-white p-6 rounded-lg mb-8 border border-[#e0e6ed] shadow-sm text-justify">
              <p className="text-[#34495e] m-0">
                <strong>Executive Summary:</strong> The ACET intelligence engine successfully processed the {schoolName} cohort. The AI intelligently mapped students to holistic career pathways by heavily weighing their cognitive capacity alongside intrinsic Holland Personality Traits. This guarantees that students are matched not only to areas of cognitive strength, but to fields where they possess strong occupational interest.
              </p>
            </div>

            {/* Primary Distribution */}
            <div className="text-2xl font-bold text-[#2c3e50] mt-8 mb-4 pb-2 border-b-2 border-[#ecf0f1]">Macro Distribution: Primary Pathways</div>
            <div className="bg-white p-6 rounded-lg mb-6 border border-[#e0e6ed] shadow-sm avoid-break">
              <p className="text-[#34495e] mb-6 text-justify">
                The cohort profile highlights a dynamic distribution, with the dominant track being <strong>{topPrimaryStr} ({topPrimaryPct}%)</strong>. The engine intelligently mapped strong mathematical and verbal abilities paired with specific personality drivers directly into respective Business, Engineering, Science, and Arts tracks.
              </p>
              <BarChart chartData={primaryCounts} color="#8e44ad" />
            </div>

            {/* Page Break for printing */}
            <div className="page-break"></div>

            {/* Micro Distribution */}
            <div className="text-2xl font-bold text-[#2c3e50] mt-8 mb-4 pb-2 border-b-2 border-[#ecf0f1] avoid-break">Micro Distribution: Futuristic Focus Areas</div>
            <div className="bg-white p-6 rounded-lg mb-6 border border-[#e0e6ed] shadow-sm avoid-break">
              <p className="text-[#34495e] mb-6 text-justify">
                This breakdown reveals the specific SSS tracks and their futuristic alignments. The AI successfully opened doors to highly sought-after areas such as <strong>{topFocusStr}</strong>. It leveraged personality tie-breakers to differentiate between students who share similar cognitive scores but have vastly different career aspirations.
              </p>
              <BarChart chartData={focusCounts} color="#d35400" />
            </div>

            {/* Top Students */}
            <div className="text-2xl font-bold text-[#2c3e50] mt-8 mb-4 pb-2 border-b-2 border-[#ecf0f1] avoid-break">Counselor Insights: Top Cognitive Performers</div>
            <div className="bg-white p-6 rounded-lg mb-6 border border-[#e0e6ed] shadow-sm avoid-break">
              <p className="text-[#34495e] mb-4 text-justify">
                The following table highlights the top 5 students by overall cognitive accuracy. Our AI engine ensured that these top-tier students were seamlessly distributed across tracks according to their true occupational interests, avoiding standard legacy tracking monopolies.
              </p>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[#ecf0f1] text-[#2c3e50] text-left p-3 text-sm uppercase">Student Name</th>
                    <th className="bg-[#ecf0f1] text-[#2c3e50] text-center p-3 text-sm uppercase">Accuracy</th>
                    <th className="bg-[#ecf0f1] text-[#2c3e50] text-left p-3 text-sm uppercase">Recommended Track</th>
                    <th className="bg-[#ecf0f1] text-[#2c3e50] text-left p-3 text-sm uppercase">Futuristic Focus Area</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="p-3 font-bold text-[#34495e]">{row['Student Name']}</td>
                      <td className="p-3 text-center">{row['Overall Accuracy (%)']}%</td>
                      <td className="p-3 text-[#8e44ad] font-semibold">{row['Primary Recommendation']}</td>
                      <td className="p-3 text-sm text-[#7f8c8d]">{row['Focus Area']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Plan */}
            <div className="text-2xl font-bold text-[#2c3e50] mt-8 mb-4 pb-2 border-b-2 border-[#ecf0f1] avoid-break">Strategic Counselor Action Plan</div>
            <div className="bg-white p-6 rounded-lg border-l-4 border-[#f39c12] shadow-sm avoid-break">
              <ul className="list-disc pl-5 text-[#34495e] leading-relaxed space-y-2">
                <li><strong>Leverage the Personality Edge:</strong> Counseling sessions should focus deeply on discussing the students' intrinsic interests to validate the AI's trait-based tracking.</li>
                <li><strong>Support the STEM Pathways:</strong> Ensure students placed in Science or Computer domains have access to foundational math and basic science clubs to build upon their assessed numerical capacities.</li>
                <li><strong>Empower the Future Founders:</strong> For students directed into Commercial tracks, highlight how their numerical proficiency and 'Enterprising' traits make them natural candidates for leadership and entrepreneurial activities.</li>
                <li><strong>Develop the Human-Centric Leaders:</strong> Arts & Humanities candidates should be encouraged to join debate teams, literary societies, and policy-focused groups to maximize their strong verbal reasoning.</li>
              </ul>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}