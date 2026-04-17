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

    // ==========================================
    // 🧠 THE EXPANDED FUTURISTIC DECISION MATRIX
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
    - JAMB SUBJECT COMBINATION: Step 2 of the roadmap MUST be exactly 4 academic subjects for the Nigerian UTME/JAMB exam. "Use of English" is compulsory. The other three must match the specialization (e.g., Mathematics, Physics, Chemistry for Engineering; Literature, Government, CRK for Law). Do not write "JAMB 2024", "JAMB 2025", or "Mock Exams".
    
    DECISION MATRIX FOR RECOMMENDATIONS: 
    You must select the "recommendation" and "specialization" strictly from the 7 tracks below, based on the student's specific cognitive scores and personality traits.

    TRACK 1: Bio-Health & Cognitive Sciences
    - Profile Triggers: High Verbal + High Numerical. Investigative and Social traits.
    - Allowed Specializations: "Bioinformatics & Genomic Medicine", "Neural Engineering & Cognitive Science", "Digital Health & Telemedicine", "Precision Medicine & Pharmacology".

    TRACK 2: Advanced Engineering & Smart Infrastructure
    - Profile Triggers: High Numerical + High Spatial/Mechanical + High Abstract. Investigative and Realistic traits.
    - Allowed Specializations: "Robotics & Autonomous Systems", "Smart City Architecture", "Sustainable Energy & Microgrid Engineering", "Quantum & Microelectronics Engineering", "Aerospace & Drone Technologies".

    TRACK 3: AI, Computing & Cyber-Physical Systems
    - Profile Triggers: High Abstract/Logical + High Numerical (Spatial can be average). Investigative and Conventional traits.
    - Allowed Specializations: "Artificial Intelligence & Machine Learning", "Cybersecurity & Zero-Trust Architecture", "Cloud Computing & Edge IoT", "Spatial Computing & Immersive Tech (XR/VR)", "Blockchain & Cryptographic Systems".

    TRACK 4: Next-Gen Business, Fintech & Analytics
    - Profile Triggers: Balanced High Numerical and High Verbal. Enterprising and Conventional traits.
    - Allowed Specializations: "Fintech & Decentralized Finance (DeFi)", "AI-Driven Market Intelligence", "ESG (Environmental & Social) Management", "Quantitative Economics & Data Analytics".

    TRACK 5: Tech-Law, Policy & Digital Humanities
    - Profile Triggers: High Verbal Reasoning, moderate/low Numerical. Enterprising, Social, or Investigative traits.
    - Allowed Specializations: "Tech Law & AI Ethics", "Cyber Diplomacy & International Relations", "Digital Mass Communication", "Cognitive Linguistics & NLP Design".

    TRACK 6: Synthetic Media, Arts & Immersive Design
    - Profile Triggers: High Verbal + High Spatial. Artistic traits.
    - Allowed Specializations: "UI/UX & Spatial Interface Design", "Computational Arts & Generative Animation", "Synthetic Media & Prompt Architecture", "Digital Sound & Interactive Entertainment".

    TRACK 7: Advanced Applied Technologies (Smart TVET)
    - Profile Triggers: High Spatial/Mechanical with Realistic traits, or a practical hands-on profile needing abstract foundational support.
    - Allowed Specializations: "Smart Home & IoT Servicing", "3D Printing & Additive Manufacturing", "Precision Agrotech & Hydroponics", "Renewable Energy Installation".

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

    // 5. Call OpenAI Engine
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