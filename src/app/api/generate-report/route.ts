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
    // 🛡️ THE VARIABLE SAMPLE SIZE DETECTOR
    // ==========================================
    const categories = gradingResult.categories || {};
    
    const absTotal = categories['Abstract/Logical Reasoning']?.total || 0;
    const spaTotal = categories['Spatial & Mechanical Reasoning']?.total || 0;
    
    const isRandomizedTest = absTotal < 10 || spaTotal < 5;

    let testContextInstruction = "";
    if (isRandomizedTest) {
      testContextInstruction = `
      CRITICAL DATA CONTEXT (RANDOMIZED/ADAPTIVE ASSESSMENT): 
      This student took a randomized version of the assessment. Because the sample sizes for "Abstract/Logical" and "Spatial & Mechanical" are statistically small, those two scores will be HIDDEN from the final PDF report.
      - DO NOT explicitly mention the words "Abstract", "Logical", "Spatial", or "Mechanical" in your counselor notes or study hacks, as it will confuse the reader.
      - To place this student in pathways that normally require those hidden scores (like Engineering, CS, or TVET), you MUST substitute the cognitive requirement by heavily weighing their Numerical Score and Holland Personality traits.
      `;
    }

    // ==========================================
    // 🧠 INJECTING PSYCHOMETRIC DATA FOR AI
    // ==========================================
    const oceanContext = gradingResult.ocean ? gradingResult.ocean.map((o: any) => `- ${o.trait}: ${o.displayScore === "N/A" ? "Not Assessed" : o.displayScore + "/50"}`).join('\n') : "No personality data available.";
    const hollandContext = gradingResult.holland ? gradingResult.holland.map((h: any) => `- ${h.code || h.trait}: ${h.displayScore === "N/A" ? "Not Assessed" : h.displayScore + "/50"}`).join('\n') : "No interest data available.";

    // ==========================================
    // ⚖️ HOLISTIC PATTERN MATCHING MATRIX
    // ==========================================
    const prompt = `
    You are an expert educational psychometrician analyzing an ACET Intelligence Report for a Nigerian secondary school student.
    
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

    PSYCHOLOGICAL & BEHAVIORAL PROFILE (OCEAN):
    ${oceanContext}

    OCCUPATIONAL INTERESTS (RIASEC):
    ${hollandContext}

    CRITICAL ADAPTIVE TESTING RULES (DO NOT HALLUCINATE):
    1. If any personality or interest score says "Not Assessed", it means the adaptive testing engine SKIPPED those questions to save time. It DOES NOT mean the student is weak or lacks interest in them. 
    2. DO NOT state that the student "lacks engagement" or "struggles" with a trait just because it was Not Assessed. Simply ignore the unassessed traits and focus your evaluation strictly on the traits that were actually scored.
    3. Look directly at the data provided above. If a student scored high in Conscientiousness or Verbal Reasoning, you MUST explicitly acknowledge and praise those specific high scores in your notes.

    YOUR TASK:
    Generate a highly personalized JSON payload analyzing this student's cognitive and psychological performance.
    
    CRITICAL NIGERIAN CURRICULUM & PDF FORMATTING RULES:
    - Keep "Study Hacks" descriptions extremely concise (Maximum of 12 words per bullet point).
    - Write professional, clinical, yet encouraging counselor notes based ONLY on the data provided.
    - SSS SUBJECT COMPLIANCE: Step 1 of the roadmap MUST align with the newly approved Nigerian NERDC curriculum groupings (Core, Humanities, Science/Math, Business, Trade/Vocational). Recommend relevant, modern SSS1 subjects.
    - JAMB SUBJECT ALLOWLIST: Step 2 of the roadmap MUST be exactly 4 subjects for the Nigerian UTME/JAMB exam. 'Use of English' is compulsory. The remaining 3 subjects MUST be strictly chosen from this list: Mathematics, Physics, Chemistry, Biology, Agricultural Science, Economics, Geography, Government, Literature-in-English, CRS, IRS, Commerce, Financial Accounting, History, French, or Visual Arts. DO NOT invent subjects like 'Robotics' or 'Technical Drawing' for JAMB.
    
    HOLISTIC PATTERN MATCHING ALGORITHM:
    You must evaluate all 7 Pathways simultaneously to find the best holistic fit. 
    
    INTEGRATION RULE (SMART FALLBACK):
    Use Cognitive Scores to determine the student's raw capacity, and use their Holland Code (Interests) to fine-tune their destination. 
    DO NOT default everyone to Commercial/Business. You may ONLY route a student to Pathway 4 based on "Conventional" or "Enterprising" if those scores are EXPLICITLY measured as high numbers (not "Not Assessed" or tied at 0). 
    If Holland scores are mostly unassessed, missing, or tied at low numbers, you MUST distribute the student based PURELY on their dominant Cognitive domains:
    - Dominant Verbal -> Route to Arts/Humanities (Pathway 5 or 6)
    - Dominant Numerical/Abstract -> Route to Science/Tech (Pathway 1, 2, or 3)
    - Dominant Spatial -> Route to Engineering/TVET (Pathway 2 or 7)

    PATHWAY 1: Bio-Health & Cognitive Sciences
    - Cognitive Base: High Verbal AND High Numerical AND High Abstract.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Biology, Chemistry & Pre-Medical Focus"

    PATHWAY 2: Advanced Engineering & Smart Infrastructure
    - Cognitive Base: High Numerical AND High Spatial/Mechanical.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Physics, Technical Drawing & Advanced Mathematics Focus"

    PATHWAY 3: AI, Computing & Cyber-Physical Systems
    - Cognitive Base: High Abstract/Logical AND High Numerical.
    - SSS Recommendation: "Science & Mathematics"
    - SSS Specialization: "Computer Studies, Physics & Mathematics Focus"

    PATHWAY 4: Next-Gen Business, Fintech & Analytics
    - Cognitive Base: Strong Numerical or Verbal. (Requires High Enterprising/Conventional ONLY if those traits were explicitly measured).
    - SSS Recommendation: "Commercial & Business"
    - SSS Specialization: "Accounting, Commerce & Financial Studies Focus"
    
    PATHWAY 5: Tech-Law, Policy & Digital Humanities
    - Cognitive Base: High Verbal Reasoning.
    - SSS Recommendation: "Arts & Humanities"
    - SSS Specialization: "Government, Literature & History Focus"

    PATHWAY 6: Synthetic Media, Arts & Immersive Design
    - Cognitive Base: High Verbal AND High Spatial.
    - SSS Recommendation: "Arts & Humanities"
    - SSS Specialization: "Creative Arts, Literature & Media Studies Focus"

    PATHWAY 7: Advanced Applied Technologies (Smart TVET)
    - Cognitive Base: High Spatial/Mechanical, OR an overall accuracy below 55% needing foundational support.
    - SSS Recommendation: "Technical & Vocational Education"
    - SSS Specialization: "Applied Sciences, Basic Technology & ICT Focus"

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
        "step1": ["SSS Subject 1", "SSS Subject 2", "SSS Subject 3"],
        "step2": ["Use of English", "Strict JAMB Subject 2", "Strict JAMB Subject 3", "Strict JAMB Subject 4"],
        "step3": ["University Degree 1", "University Degree 2"],
        "step4": ["Futuristic Career 1", "Futuristic Career 2", "Futuristic Career 3"]
      },
      "careerBridge": [
        {
          "traditionalDegree": "String",
          "futuristicCareer": "String",
          "alignmentReason": "String"
        },
        {
          "traditionalDegree": "String",
          "futuristicCareer": "String",
          "alignmentReason": "String"
        },
        {
          "traditionalDegree": "String",
          "futuristicCareer": "String",
          "alignmentReason": "String"
        }
      ]
    }
    `;

    // 5. Call OpenAI Engine
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a highly analytical educational psychometrician. You must evaluate all pathways simultaneously, enforce the strict JAMB subject allowlist, and effectively map traditional Nigerian university degrees to futuristic roles in your careerBridge output." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content;

    if (!responseText) {
      throw new Error("OpenAI returned an empty response.");
    }

    const generatedData = JSON.parse(responseText);

    // 6. MERGE AND RESCUE THE DATA 
    const existingAiData = studentData?.aiReportData || {};
    
    const rescuedOcean = studentData?.ocean || existingAiData.ocean || [];
    const rescuedHolland = studentData?.holland || existingAiData.holland || [];
    
    const aiReportData = {
      ...existingAiData, 
      ...generatedData,    
      ocean: rescuedOcean,
      holland: rescuedHolland
    };

    // 7. Save the merged AI Data back to the Student's Firebase Profile
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