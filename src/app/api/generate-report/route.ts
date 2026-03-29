import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const maxDuration = 120; 

export async function POST(req: Request) {
  // 🔥 Moved inside the function so Vercel ignores it during the build!
  const openai = new OpenAI(); 

  try {
    const body = await req.json();
    const { studentId, gradingResult } = body;

    if (!studentId || !gradingResult) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });
    }

    const studentRef = doc(db, 'Students', studentId);
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const studentData = studentSnap.data();

    const schoolName = studentData.organizationId || 'Independent Assessment Candidate';
    const rawDataContext = `
      Student Name: ${studentData.name}
      Class: ${studentData.classLevel}
      School: ${schoolName}
      Final Overall Score: ${gradingResult.percentage}%
      Item Analysis: ${JSON.stringify(gradingResult.breakdown)}
    `;

    const aiModel = 'gpt-4o-mini'; 
    const isJSS3 = studentData.classLevel === 'JSS 3';
    
    const reportTitle = isJSS3 
      ? "The JSS 3 Baseline Report: The Career Architect" 
      : "The SSS 3 Growth Engine Report: The Future-Ready Architect";

    // 🔥 THE DATA-DRIVEN PROMPT
    const systemPrompt = `You are an elite educational psychometrician in Nigeria writing a 15-page clinical data report titled "${reportTitle}" for ${schoolName}.
    
    CRITICAL INSTRUCTIONS:
    1. NO ESSAYS: Do not write long, boring paragraphs. Use concise bullet points, bold text, and clinical language.
    2. DATA TABLES FIRST: You MUST extrapolate the student's raw data into specific sub-domains (Verbal, Numerical, Spatial, Logical) and present them in beautifully styled HTML tables.
    3. TABLE STYLING: Use this exact styling for all tables: <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: sans-serif; font-size: 14px;"><tr style="background-color: #004AAD; color: white;"><th style="padding: 10px; border: 1px solid #ddd;">...
    4. CSS INFOGRAPHICS: To show readiness or skill levels, you MUST use this exact HTML progress bar:
       <div style="margin-bottom: 15px; font-family: sans-serif;">
         <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><b>[Skill Name]</b><span style="font-weight: bold; color: #004AAD;">[Score]%</span></div>
         <div style="width: 100%; background-color: #e5e7eb; border-radius: 8px; overflow: hidden; height: 12px;">
           <div style="width: [Score]%; background-color: #004AAD; height: 100%;"></div>
         </div>
       </div>
    5. DELIMITER: Separate EVERY page with exactly: ====PAGE_BREAK====
    6. NO <html> tags. Output raw HTML <div> elements only.`;

    // 📦 PAGE LAYOUTS COMMANDING INFOGRAPHICS & TABLES
    const chunk1Prompt = isJSS3 
      ? `1. Executive Summary: Provide a high-level bulleted snapshot.
         2. Cognitive Abilities Assessment: MUST include a Data Table showing Subtest, Raw Score, Z-Score, and Interpretation (Below Average, Average, Above Average) for Verbal, Numerical, Spatial, and Logical Reasoning.
         3. Personality & Occupational Profile: MUST include a Data Table for Holland Codes (RIASEC) and Big Five Traits.
         4. Linguistic & Numerical Aptitude: Use CSS Progress Bars (Infographics) to show specific sub-skill strengths.
         5. The "Streaming Recommendation": A data-backed verdict.`
      : `1. Executive Summary & Trajectory Snapshot: Short bullet points.
         2. Cognitive Abilities Assessment: MUST include a Data Table showing Subtest, Raw Score, Z-Score, and Interpretation (Below Average, Average, Above Average) for Verbal, Numerical, Spatial, and Logical Reasoning.
         3. Personality & Occupational Profile: MUST include a Data Table for Holland Codes (RIASEC) and Big Five Traits.
         4. Core Competency Heat-Map: Use CSS Progress Bars (Infographics) for Math and English readiness.
         5. The 30-Day Remedial "Sprint": Bulleted intervention plan.`;

    const p1 = openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Write sections 1 to 5 separated by ====PAGE_BREAK====.\nData:\n${rawDataContext}\nSections:\n${chunk1Prompt}` }]
    });

    const chunk2Prompt = isJSS3
      ? `6. Math Foundation (Use bullet points)
         7. Science Foundation (Use bullet points)
         8. Vocational Interest Inventory (Include a table mapping interests to industries)
         9. Skill-Gap Analysis (Use CSS Progress bars for soft skills)
         10. Learning Style Identification (Visual, Auditory, Kinesthetic breakdown)`
      : `6. Cognitive-to-Course Alignment (Use bullet points)
         7. Degree Decoder (Top 3 Recommendations in a clean table)
         8. Institutional Strategy (Target Universities)
         9. Scholarship Viability (Use CSS Progress Bar for viability score)
         10. Alternative Tech Pathways (List certifications)`;

    const p2 = openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Write sections 6 to 10 separated by ====PAGE_BREAK====.\nData:\n${rawDataContext}\nSections:\n${chunk2Prompt}` }]
    });

    const chunk3Prompt = isJSS3
      ? `11. Future Career Pathways (Top 3 in a table)
         12. University Roadmap (JAMB combinations)
         13. Institutional Benchmarking
         14. Growth Strategy (12-month bulleted plan)
         15. Parent/Teacher Agreement (Signature blocks)`
      : `11. 2030 Industry Projection (Data table showing projected growth)
         12. Soft Skills & Leadership Audit (Use CSS Progress bars for EQ, Adaptability)
         13. Global Competitiveness Index
         14. 5-Year Career Blueprint (Step-by-step timeline)
         15. Principal’s Endorsement (Signature blocks for ${schoolName})`;

    const p3 = openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Write sections 11 to 15 separated by ====PAGE_BREAK====.\nData:\n${rawDataContext}\nSections:\n${chunk3Prompt}` }]
    });

    const [chunk1, chunk2, chunk3] = await Promise.all([p1, p2, p3]);

    let rawHTML = (chunk1.choices[0].message.content || '') + '\n====PAGE_BREAK====\n' + 
                  (chunk2.choices[0].message.content || '') + '\n====PAGE_BREAK====\n' + 
                  (chunk3.choices[0].message.content || '');

    // Aggressive cleanup
    rawHTML = rawHTML.replace(/```html\n|```html|```/g, '');
    rawHTML = rawHTML.replace(/<!DOCTYPE html>|<html>|<\/html>|<body>|<\/body>|<head>|<\/head>/gi, '');

    const sections = rawHTML.split('====PAGE_BREAK====').map(s => s.trim()).filter(s => s.length > 20);

    const paginatedHTML = sections.map((section) => `
      <div style="page-break-after: always; clear: both; min-height: 1040px; padding: 40px; background: white;">
        ${section}
      </div>
    `).join('');

    // Added a wrapper with a clean, professional font to mimic the old PDF
    const fullReportHTML = `
      <div class="ai-report-content" style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.5;">
        ${paginatedHTML}
      </div>
    `;

    await updateDoc(studentRef, {
      aiReportData: fullReportHTML,
      reportGeneratedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}