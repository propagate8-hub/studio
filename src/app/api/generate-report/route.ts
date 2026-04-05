import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const maxDuration = 120; 

export async function POST(req: Request) { const openai = new OpenAI();
  try {
    const body = await req.json();
    const { studentId, gradingResult } = body;

    if (!studentId || !gradingResult) {
      return NextResponse.json({ error: 'Missing student ID or grading data' }, { status: 400 });
    }

    // 1. Fetch Student Data
    const studentRef = doc(db, 'Students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      return NextResponse.json({ error: 'Student not found in database' }, { status: 404 });
    }

    const studentData = studentSnap.data();
    const schoolName = studentData.organizationId || 'Independent Assessment Candidate';

    // 2. Package the Raw Data for the AI
    const rawDataContext = `
      Student Name: ${studentData.name}
      Class/Cohort: ${studentData.classLevel}
      School: ${schoolName}
      Final Score: ${gradingResult.percentage}% (${gradingResult.score}/${gradingResult.total})
      Detailed Item Analysis: ${JSON.stringify(gradingResult.breakdown)}
    `;

    const aiModel = 'gpt-4o-mini'; // Keep this on mini for testing!
    const isJSS3 = studentData.classLevel === 'JSS 3';

    // 3. THE STRICT JSON PROMPT
    // We explicitly map the data structure to exactly match your new React Infographic component.
    const systemPrompt = `You are an elite educational psychometrician in Nigeria analyzing student data for ${schoolName}.
    You MUST respond with a valid JSON object. Do not include any markdown formatting, HTML, or conversational text.
    
    Analyze the student's data and return a JSON object with EXACTLY this structure:
    {
      "recommendation": "String. The primary stream (e.g., 'Science and Mathematics', 'Humanities', 'Vocational Education').",
      "specialization": "String. The secondary focus (e.g., 'Technology', 'Creative & Cultural Arts').",
      "studyHacks": {
        "intro": "String. A 2-sentence summary of their learning style based on their highest cognitive scores.",
        "bullets": [
          { "title": "String. Actionable hack 1", "desc": "String. 1-sentence explanation" },
          { "title": "String. Actionable hack 2", "desc": "String. 1-sentence explanation" },
          { "title": "String. Actionable hack 3", "desc": "String. 1-sentence explanation" }
        ]
      },
      "skillGap": {
        "focus": "String. Catchy title for their weakest area (e.g., 'The Verbal-Legal Gap', 'The Abstract-Logic Gap').",
        "description": "String. A clinical, 2-sentence explanation of what they need to improve."
      },
      "roadmap": {
        "step1": ["String", "String", "String"], // 3 Subjects for SS1
        "step2": ["String", "String", "String", "String"], // 4 JAMB Subjects
        "step3": ["String", "String", "String"], // 3 University Degrees
        "step4": ["String", "String", "String"]  // 3 Specific Career Titles
      },
      "counselorNotes": "String. A highly professional, 4-sentence clinical summary of their cognitive and personality profile, similar to a doctor's chart notes."
    }`;

    // 4. Call OpenAI (Forcing JSON Mode)
    const response = await openai.chat.completions.create({
      model: aiModel,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt }, 
        { role: 'user', content: `Analyze this data and return the strict JSON object:\n\n${rawDataContext}` }
      ]
    });

    const rawJSONString = response.choices[0].message.content || '{}';
    
    // 5. Parse the JSON to ensure it is valid before saving
    const parsedData = JSON.parse(rawJSONString);

    // 6. Save the structured JSON object directly to Firestore
    await updateDoc(studentRef, {
      aiReportData: parsedData,
      reportGeneratedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}