import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    // 1. Initialize Firebase Admin
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

    // 2. Initialize OpenAI Client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await req.json();
    const { studentId, gradingResult } = body;

    if (!studentId || !gradingResult) {
      return NextResponse.json({ error: 'Missing studentId or gradingResult' }, { status: 400 });
    }

    // 3. Fetch the Student Profile
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
    // ⚖️ LOAD-BALANCED DECISION MATRIX
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
    - Keep "Study Hacks" descriptions extremely concise (Maximum of 12 words per bullet point).
    - Write professional, clinical, yet encouraging counselor notes.
    - JAMB SUBJECT COMBINATION: Step 2 of the roadmap MUST be exactly 4 academic subjects for the Nigerian UTME/JAMB exam. "Use of English" is compulsory. Do not write "JAMB 2024" or "Mock Exams".
    
    EVALUATION HIERARCHY (YOU MUST EVALUATE IN THIS EXACT ORDER TO PREVENT BIAS):
    
    STEP 1: TVET / APPLIED TECHNOLOGIES CHECK
    - Condition: If "Spatial & Mechanical" is their highest cognitive score, OR if Overall Accuracy is below 55% with high "Realistic" personality traits.
    - SSS Recommendation: "Technical & Vocational Education"
    - SSS Specialization: "Applied Sciences, Basic Technology & ICT Focus"
    - Futuristic Careers: Smart Home Servicing, 3D Printing, Precision Agrotech, Renewable Energy.

    STEP 2: BUSINESS & COMMERCE CHECK
    - Condition: If "Enterprising" or "Conventional" are dominant personality traits, OR if Numerical and Verbal are roughly equal (balanced profile). 
    - SSS Recommendation: "Commercial & Business"
    - SSS Specialization: "Accounting, Commerce & Financial Studies Focus"
    - Futuristic Careers: Fintech, DeFi, ESG Management, Quantitative Economics, Market Intelligence.

    STEP 3: ARTS, LAW & MEDIA CHECK
    - Condition: If "Verbal" is strictly higher than "Numerical", OR if "Social" or "Artistic" are dominant traits.
    - SSS Recommendation: "Arts & Humanities"
    - SSS Specialization: "Government, Literature & History Focus" OR "Creative Arts & Media Studies Focus"
    - Futuristic Careers: Tech Law, Cyber Diplomacy, UI/UX Design, Synthetic Media, Digital Mass Communication.

    STEP 4: COMPUTER SCIENCE & AI CHECK
    - Condition: If "Abstract/Logical" is their absolute highest score, supported by good Numerical.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Computer Studies, Physics & Mathematics Focus"
    - Futuristic Careers: Artificial Intelligence, Cybersecurity, Cloud Computing, Blockchain.

    STEP 5: ENGINEERING & ARCHITECTURE CHECK
    - Condition: If they have High Numerical AND High Spatial/Mechanical.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Physics, Technical Drawing & Advanced Mathematics Focus"
    - Futuristic Careers: Robotics, Smart City Architecture, Sustainable Energy, Aerospace.

    STEP 6: BIO-HEALTH & MEDICINE CHECK (ONLY IF NOT CAUGHT BY STEPS 1-5)
    - Condition: High Verbal + High Numerical + High Abstract, with "Investigative" traits. Do not default to this track unless the profile is exceptionally balanced across sciences.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Biology, Chemistry & Pre-Medical Focus"
    - Futuristic Careers: Bioinformatics, Genomic Medicine, Neural Engineering, Telemedicine.

    OUTPUT EXACTLY THIS JSON STRUCTURE AND NOTHING ELSE:
    {
      "recommendation": "String (Must be 'Science & Mathematics', 'Commercial & Business', 'Arts & Humanities', or 'Technical & Vocational Education')",
      "specialization": "String (Must be the SSS Specialization Focus from the chosen Step)",
      "studyHacks": {
        "intro": "String (1 brief sentence)",
        "bullets": [
          { "title": "String", "desc": "String (MAX 12 WORDS)" },
          { "title": "String", "desc": "String (MAX 12 WORDS)" },
          { "title": "String", "desc": "String (MAX 12 WORDS)" }
        ]
      },
      "skillGap": {
        "focus": "String",
        "description": "String (2 brief sentences)"
      },
      "counselorNotes": "String (1 paragraph clinical summary)",
      "roadmap": {
        "step1": ["Subject 1", "Subject 2", "Subject 3"],
        "step2": ["Use of English", "JAMB Subject 2", "JAMB Subject 3", "JAMB Subject 4"],
        "step3": ["Futuristic Degree 1", "Futuristic Degree 2", "Futuristic Degree 3"],
        "step4": ["Futuristic Career 1", "Futuristic Career 2", "Futuristic Career 3"]
      }
    }
    `;

    // 5. Call OpenAI Engine
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a highly analytical educational psychometrician. Follow the evaluation hierarchy strictly." },
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