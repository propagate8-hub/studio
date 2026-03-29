"use client";
import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2">1. Propagate Digital: Terms of Service (ACET Product) [cite: 41]</h1>
        <p className="text-gray-500 mb-8 font-medium">Effective Date: March 3, 2026 [cite: 42]</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">1.1. The Agreement [cite: 43]</h2>
            <p className="mb-2">These Terms of Service govern your use of the ACET platform and all related diagnostic services provided by Propagate Digital ("the Company"). [cite: 44]</p>
            <p>By registering a student for an ACET assessment, you ("the Parent" or "the Legal Guardian") agree to these terms. [cite: 45]</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">1.2. Service Description [cite: 46]</h2>
            <p className="mb-2">Propagate Digital provides the ACET diagnostic assessment, which includes: [cite: 47]</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>JSS 3 Baseline:</strong> Cognitive auditing and departmental streaming recommendations. [cite: 48]</li>
              <li><strong>SSS 3 Readiness:</strong> Predictive exam scoring for WAEC, NECO, and JAMB. [cite: 49]</li>
              <li><strong>Analytics:</strong> A comprehensive 15-page intelligence report per student. [cite: 50]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">1.3. Parental Representation & Consent [cite: 51]</h2>
            <p className="mb-2">In accordance with Nigerian law regarding minors, Propagate Digital only enters into contracts with adults. [cite: 52]</p>
            <p className="mb-2">You represent that you are the legal parent or guardian of the student being registered. [cite: 53]</p>
            <p>You grant express permission for the student to participate in the assessment under your supervision or the supervision of an authorized partner school. [cite: 54]</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">1.4. Payments & Refund Policy [cite: 55]</h2>
            <p className="mb-2">Fees paid to Propagate Digital for the ACET assessment are for the generation of personalized data analytics. [cite: 56]</p>
            <p>Once an assessment has been completed and the 15-page report generated, the service is deemed "fully rendered," and no refunds will be issued. </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">1.5. Intellectual Property [cite: 58]</h2>
            <p className="mb-2">All ACET test content, proprietary "Nano-Adaptive" algorithms, and report formats are the exclusive intellectual property of Propagate Digital. </p>
            <p>Any unauthorized reproduction or distribution is strictly prohibited. [cite: 60]</p>
          </section>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <button 
              onClick={() => window.close()} 
              className="text-[#004AAD] font-bold hover:underline"
            >
              Close this window
            </button>
        </div>
      </div>
    </div>
  );
}