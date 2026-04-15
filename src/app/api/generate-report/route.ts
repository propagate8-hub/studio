import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    // 1. Initialize Firebase Admin INSIDE the route to prevent Vercel build crashes
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
      }
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    const db = admin.firestore();

    // 2. Initialize OpenAI Client dynamically
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await req.json();
    const { studentId, gradingResult } = body;

    if (!studentId || !gradingResult) {
      return NextResponse.json({ error: 'Missing studentId or gradingResult' }, { status: 400 });
    }

    // 3. Fetch the Student's Full Profile from Firebase
    const studentRef = db.collection('Students').doc(studentId);
    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) {
      return NextResponse.json({ error: 'Student not found in database' }, { status: 404 });
    }

    const studentData = studentSnap.data();
    
    // ==========================================
    // 🚨 THE DYNAMIC PRONOUN ENGINE
    // ==========================================
    const studentGender = studentData?.gender ? studentData.gender.toLowerCase() : 'unknown';
    let pronounInstruction = "Use gender-neutral pronouns (they/them/theirs).";
    
    if (studentGender === 'female') {
      pronounInstruction = "CRITICAL: The student is female. You MUST strictly use feminine pronouns (she/her/hers). Do not use he, him, his, or they.";
    } else if (studentGender === 'male') {
      pronounInstruction = "CRITICAL: The student is male. You MUST strictly use masculine pronouns (he/him/his). Do not use she, her, hers, or they.";
    }

    // 4. Construct the Master Prompt
    const prompt = `
    You are an expert educational psychometrician analyzing an ACET Intelligence Report.
    
    STUDENT PROFILE:
    Name: ${studentData?.name}
    Class Level: ${studentData?.classLevel}
    Overall Accuracy: ${gradingResult.percentage}%
    
    ${pronounInstruction}

    COGNITIVE BREAKDOWN:
    ${Object.entries(gradingResult.categories).map(([cat, data]: any) => 
      `- ${cat}: ${data.correct} / ${data.total}`
    ).join('\n')}

    YOUR TASK:
    Generate a highly personalized JSON payload analyzing this student's cognitive performance.
    
    CRITICAL PDF FORMATTING RULES:
    - Keep "Study Hacks" descriptions extremely concise (Maximum of 12 words per bullet point) to prevent PDF overflow.
    - Write professional, clinical, yet encouraging counselor notes.

    OUTPUT EXACTLY THIS JSON STRUCTURE AND NOTHING ELSE:
    {
      "recommendation": "String (e.g., Science & Technology, Vocational Education)",
      "specialization": "String (e.g., Engineering, Creative & Cultural Arts)",
      "studyHacks": {
        "intro": "String (1 brief sentence)",
        "bullets": [
          { "title": "String", "desc": "String (MAX 12 WORDS)" },
          { "title": "String", "desc": "String (MAX 12 WORDS)" },
          { "title": "String", "desc": "String (MAX 12 WORDS)" }
        ]
      },
      "skillGap": {
        "focus": "String (e.g., The Abstract-Logic Gap)",
        "description": "String (2 brief sentences)"
      },
      "counselorNotes": "String (1 paragraph clinical summary)",
      "roadmap": {
        "step1": ["Subject 1", "Subject 2", "Subject 3"],
        "step2": ["JAMB 1", "JAMB 2", "JAMB 3", "JAMB 4"],
        "step3": ["Degree 1", "Degree 2", "Degree 3"],
        "step4": ["Career 1", "Career 2", "Career 3"]
      }
    }
    `;

    // 5. Call OpenAI Engine (Using GPT-4o-mini for speed and strict JSON formatting)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a data-formatting assistant designed to output strictly valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content;

    if (!responseText) {
      throw new Error("OpenAI returned an empty response.");
    }

    const aiReportData = JSON.parse(responseText);

    // 6. Save the AI Data back to the Student's Firebase Profile
    await studentRef.update({
      aiReportData,
      reportGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, aiReportData });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}