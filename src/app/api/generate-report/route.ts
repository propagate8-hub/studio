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
    // 🛡️ THE VARIABLE SAMPLE SIZE DETECTOR (ROSEVILLE FIX)
    // ==========================================
    const categories = gradingResult.categories || {};
    
    // Check if Abstract or Spatial have fewer than 10 questions. If they do, it's a randomized/legacy test.
    const absTotal = categories['Abstract/Logical Reasoning']?.total || 0;
    const spaTotal = categories['Spatial & Mechanical Reasoning']?.total || 0;
    
    const isRandomizedTest = absTotal < 10 || spaTotal < 5;

    let testContextInstruction = "";
    if (isRandomizedTest) {
      testContextInstruction = `
      CRITICAL DATA CONTEXT (RANDOMIZED ASSESSMENT): 
      This student took a randomized version of the assessment. Because the sample sizes for "Abstract/Logical" and "Spatial & Mechanical" are statistically small, those two scores will be HIDDEN from the final PDF report.
      - DO NOT explicitly mention the words "Abstract", "Logical", "Spatial", or "Mechanical" in your counselor notes or study hacks, as it will confuse the reader.
      - To place this student in pathways that normally require those hidden scores (like Engineering, CS, or TVET), you MUST substitute the cognitive requirement by heavily weighing their Numerical Score and Holland Personality traits (e.g., High Numerical + Investigative = CS; Average Numerical + Realistic = TVET).
      `;
    }

    // ==========================================
    // ⚖️ HOLISTIC PATTERN MATCHING MATRIX
    // ==========================================
    const prompt = `
    You are an expert educational psychometrician analyzing an ACET Intelligence Report.
    
    STUDENT PROFILE:
    Name: ${studentData?.name}
    Class Level: ${studentData?.classLevel}
    Overall Accuracy: ${gradingResult.percentage}%
    
    ${pronounInstruction}
    ${testContextInstruction}

    COGNITIVE BREAKDOWN (Format is Correct / Total Asked):
    ${Object.entries(gradingResult.categories).map(([cat, data]: any) => 
      `- ${cat}: ${data.correct} / ${data.total}`
    ).join('\n')}

    YOUR TASK:
    Generate a highly personalized JSON payload analyzing this student's cognitive performance.
    
    CRITICAL PDF FORMATTING RULES:
    - Keep "Study Hacks" descriptions extremely concise (Maximum of 12 words per bullet point).
    - Write professional, clinical, yet encouraging counselor notes.
    - JAMB SUBJECT COMBINATION: Step 2 of the roadmap MUST be exactly 4 academic subjects for the Nigerian UTME/JAMB exam. "Use of English" is compulsory. Do not write "JAMB 2024" or "Mock Exams".
    
    HOLISTIC PATTERN MATCHING ALGORITHM:
    You must evaluate all 7 Pathways simultaneously to find the best holistic fit. 

    INTEGRATION RULE (COGNITIVE + PERSONALITY):
    Use Cognitive Scores to determine the student's raw capacity, but use their Holland Code (Interests) to dictate their destination. 
    ANTI-MONOPOLY RULE: Do NOT dump every high-scoring student into Medicine or Computer Science. Allow students to flow into Business and Arts based on their highest unique personality traits.

    PATHWAY 1: Bio-Health & Cognitive Sciences
    - Cognitive Base: High Verbal AND High Numerical AND High Abstract.
    - Personality Match: Investigative or Social traits.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Biology, Chemistry & Pre-Medical Focus"
    - Futuristic Careers: Bioinformatics, Genomic Medicine, Neural Engineering, Telemedicine.

    PATHWAY 2: Advanced Engineering & Smart Infrastructure
    - Cognitive Base: High Numerical AND High Spatial/Mechanical.
    - Personality Match: Realistic or Investigative traits.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Physics, Technical Drawing & Advanced Mathematics Focus"
    - Futuristic Careers: Robotics, Smart City Architecture, Sustainable Energy, Aerospace.

    PATHWAY 3: AI, Computing & Cyber-Physical Systems
    - Cognitive Base: High Abstract/Logical AND High Numerical.
    - Personality Match: Investigative traits.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Computer Studies, Physics & Mathematics Focus"
    - Futuristic Careers: Artificial Intelligence, Cybersecurity, Cloud Computing, Blockchain.

    PATHWAY 4: Next-Gen Business, Fintech & Analytics
    - Cognitive Base: Any combination of Verbal and Numerical scores.
    - Personality Match: CRITICAL OVERRIDE - If the student's highest Holland traits are "Enterprising" or "Conventional", you MUST route them here, bypassing all STEM tracks.
    - SSS Recommendation: "Commercial & Business"
    - SSS Specialization: "Accounting, Commerce & Financial Studies Focus"
    - Futuristic Careers: Fintech, DeFi, ESG Management, Quantitative Economics, Market Intelligence.

    PATHWAY 5: Tech-Law, Policy & Digital Humanities
    - Cognitive Base: High Verbal Reasoning (Numerical can be moderate or low).
    - Personality Match: Heavily favor if the student shows Social, Enterprising, or Investigative traits.
    - SSS Recommendation: "Arts & Humanities"
    - SSS Specialization: "Government, Literature & History Focus"
    - Futuristic Careers: Tech Law, Cyber Diplomacy, UI/UX Design, Synthetic Media, Digital Mass Communication.

    PATHWAY 6: Synthetic Media, Arts & Immersive Design
    - Cognitive Base: High Verbal AND High Spatial.
    - Personality Match: Heavily favor if the student shows Artistic traits.
    - SSS Recommendation: "Arts & Humanities"
    - SSS Specialization: "Creative Arts, Literature & Media Studies Focus"
    - Futuristic Careers: UI/UX Design, Computational Arts, Generative Animation.

    PATHWAY 7: Advanced Applied Technologies (Smart TVET)
    - Cognitive Base: High Spatial/Mechanical, OR an overall accuracy below 55% needing foundational support.
    - Personality Match: Realistic (hands-on) traits.
    - SSS Recommendation: "Technical & Vocational Education"
    - SSS Specialization: "Applied Sciences, Basic Technology & ICT Focus"
    - Futuristic Careers: Smart Home Servicing, 3D Printing, Precision Agrotech, Renewable Energy.

    OUTPUT EXACTLY THIS JSON STRUCTURE AND NOTHING ELSE:
    {
      "recommendation": "String (Must be 'Science & Mathematics', 'Commercial & Business', 'Arts & Humanities', or 'Technical & Vocational Education')",
      "specialization": "String (Must be the SSS Specialization Focus from the chosen Pathway)",
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
        { role: "system", content: "You are a highly analytical educational psychometrician. You must evaluate all 7 pathways simultaneously and rely heavily on the integration rules and trait overrides to find the absolute best holistic fit." },
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