import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await req.json();
    const { studentId, gradingResult } = body;

    if (!studentId || !gradingResult) {
      return NextResponse.json({ error: 'Missing studentId or gradingResult' }, { status: 400 });
    }

    const studentRef = db.collection('Students').doc(studentId);
    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) {
      return NextResponse.json({ error: 'Student not found in database' }, { status: 404 });
    }

    const studentData = studentSnap.data();
    
    // ==========================================
    // 🚨 DYNAMIC PRONOUN ENGINE
    // ==========================================
    const studentGender = studentData?.gender ? studentData.gender.toLowerCase() : 'unknown';
    let pronounInstruction = "Use gender-neutral pronouns (they/them/theirs).";
    
    if (studentGender === 'female') {
      pronounInstruction = "CRITICAL: The student is female. You MUST strictly use feminine pronouns (she/her/hers). Do not use he, him, his, or they.";
    } else if (studentGender === 'male') {
      pronounInstruction = "CRITICAL: The student is male. You MUST strictly use masculine pronouns (he/him/his). Do not use she, her, hers, or they.";
    }

    // ==========================================
    // 🧠 THE EXPANDED DECISION MATRIX PROMPT
    // ==========================================
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
    - JAMB SUBJECT COMBINATION: Step 2 of the roadmap MUST be exactly 4 academic subjects for the Nigerian UTME/JAMB exam. "Use of English" is compulsory. The other three must match the specialization (e.g., Mathematics, Physics, Chemistry for Engineering; Literature, Government, CRK for Law). Do not write "JAMB 2024" or "Mock Exams".
    
    DECISION MATRIX FOR RECOMMENDATIONS: 
    You must select the "recommendation" and "specialization" strictly from the 7 tracks below, based on the student's specific cognitive scores and personality traits.

    TRACK 1: Medical & Health Sciences
    - Profile Triggers: High Verbal + High Numerical. Investigative and Social traits.
    - Allowed Specializations: "Medicine & Surgery", "Pharmacy & Pharmacology", "Nursing & Public Health", "Biomedical Sciences".

    TRACK 2: Engineering & Architecture
    - Profile Triggers: High Numerical + High Spatial/Mechanical + High Abstract. Investigative and Realistic traits.
    - Allowed Specializations: "Mechanical & Aerospace Engineering", "Civil Engineering & Architecture", "Electrical & Electronics", "Chemical & Petroleum Engineering".

    TRACK 3: Computer Science & Technology
    - Profile Triggers: High Abstract/Logical + High Numerical (Spatial can be average/low). Investigative and Conventional traits.
    - Allowed Specializations: "Artificial Intelligence & Data Science", "Software Engineering", "Cybersecurity & Network Administration".

    TRACK 4: Business, Finance & Management
    - Profile Triggers: Balanced High Numerical and High Verbal. Enterprising and Conventional traits.
    - Allowed Specializations: "Accounting & Corporate Finance", "Business Administration", "Economics & Market Analytics".

    TRACK 5: Law, Public Policy & Humanities
    - Profile Triggers: High Verbal Reasoning, moderate/low Numerical. Enterprising, Social, or Investigative traits.
    - Allowed Specializations: "Law & Jurisprudence", "International Relations & Diplomacy", "Mass Communication & Journalism".

    TRACK 6: Creative Arts, Media & Design
    - Profile Triggers: High Verbal + High Spatial. Artistic traits.
    - Allowed Specializations: "UI/UX & Digital Design", "Fine Arts & Graphic Design", "Theatre & Media Production".

    TRACK 7: Applied Technologies & TVET
    - Profile Triggers: High Spatial/Mechanical with Realistic traits, or a practical hands-on profile needing abstract foundational support.
    - Allowed Specializations: "Renewable Energy & Solar Tech", "Agribusiness & Food Tech", "Digital Craft & Hardware Servicing".

    OUTPUT EXACTLY THIS JSON STRUCTURE AND NOTHING ELSE:
    {
      "recommendation": "String (Must be exactly one of the 7 Tracks listed above)",
      "specialization": "String (Must be exactly one of the Allowed Specializations under the chosen Track)",
      "studyHacks": {
        "intro": "String (1 brief sentence)",
        "bullets": [
          { "title": "String", "desc": "String (MAX 12 WORDS)" },
          { "title": "String", "desc": "String (MAX 12 WORDS)" },
          { "title": "String", "desc": "String (MAX 12 WORDS)" }
        ]
      },
      "skillGap": {
        "focus": "String (e.g., The Spatial-Mechanical Gap)",
        "description": "String (2 brief sentences)"
      },
      "counselorNotes": "String (1 paragraph clinical summary)",
      "roadmap": {
        "step1": ["Subject 1", "Subject 2", "Subject 3"],
        "step2": ["Use of English", "JAMB Subject 2", "JAMB Subject 3", "JAMB Subject 4"],
        "step3": ["Degree 1", "Degree 2", "Degree 3"],
        "step4": ["Career 1", "Career 2", "Career 3"]
      }
    }
    `;

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