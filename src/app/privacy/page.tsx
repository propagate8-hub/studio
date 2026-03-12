import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy (ACET Platform)</h1>
        <p className="text-gray-500 mb-8 font-medium">Last Updated: March 3, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.1. Introduction & Governance</h2>
            <p>Propagate Digital is committed to the highest standards of data privacy. This policy is governed by the Nigeria Data Protection Act (NDPA) 2023 and the Nigeria Data Protection Regulation (NDPR).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.2. Data Controller Information</h2>
            <p>Propagate Digital acts as the Data Controller for all information collected through the ACET platform. Contact: dpo@propagatedigital.com</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.3. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Parent/Guardian Information:</strong> Name, phone number, and email (for report delivery).</li>
              <li><strong>Student Information:</strong> Name, gender, age, class level (JSS3/SSS3), and school.</li>
              <li><strong>Cognitive & Academic Data:</strong> Responses to assessment questions, time-taken per module, and logical pattern recognition.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.4. Legal Basis: Parental Consent (Section 31 NDPA)</h2>
            <p>The processing of data for minors is based solely on the Clear and Affirmative Consent of the parent or guardian. By checking the "I Consent" box upon registration, you authorize Propagate Digital to process your child's data for academic diagnostic purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.5. Data Security (The "Offline-First" Protocol)</h2>
            <p>Propagate Digital utilizes a proprietary Offline-First sync engine. Student data is captured locally on secure school-based or device-based environments and synchronized with our central encrypted database only via secure protocols. This minimizes the risk of real-time data interception.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.6. Data Retention: The "Growth Tracking" Window</h2>
            <p>We retain student data for a period of three (3) years. This allows us to provide "Growth Metrics," comparing a student’s JSS 3 Baseline with their SSS 3 Graduation readiness. After this period, data is either deleted or fully anonymized.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.7. Third-Party Sharing</h2>
            <p>Propagate Digital will never sell student performance data. Data is shared only with:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Authorized Partner Schools:</strong> If the student is part of a B2B cohort (e.g., Queens College).</li>
              <li><strong>Payment Processors:</strong> Only to facilitate transaction verification.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#004AAD] mb-3">2.8. Your Rights</h2>
            <p>Parents may contact Propagate Digital at any time to request a copy of the data held on their child, request immediate deletion (The Right to be Forgotten), or rectify inaccurate biographical information.</p>
          </section>
        </div>
      </div>
    </div>
  );
}