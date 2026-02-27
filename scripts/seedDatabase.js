const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * SEED SCRIPT FOR ACET QUESTIONS
 */

// Initialize Firebase Admin using the service account key in the root directory
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'studio-8583003732-8c0f2'
});

const db = admin.firestore();

const dataFiles = [
  'AbstractQ1-60.txt',
  'NumeracyQ1-60.txt',
  'Occupational Interests RIASEC.txt',
  'Personality Traits.txt',
  'SpatialQ1-60.txt',
  'VerbalQ1-60.txt'
];

async function seedDatabase() {
  let allQuestions = [];

  console.log('--- Starting Data Parsing ---');

  for (const fileName of dataFiles) {
    const filePath = path.join(__dirname, '../data', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARNING] File not found: ${filePath}`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const questionsArray = JSON.parse(fileContent);
      console.log(`[SUCCESS] Parsed ${fileName}: Found ${questionsArray.length} items.`);
      allQuestions = allQuestions.concat(questionsArray);
    } catch (error) {
      console.error(`[ERROR] Failed to parse ${fileName}:`, error.message);
    }
  }

  console.log(`\nTotal questions combined: ${allQuestions.length}`);
  console.log('--- Starting Image URL Transformation ---');

  const storageBucket = 'studio-8583003732-8c0f2.firebasestorage.app';
  
  const processedQuestions = allQuestions.map((q) => {
    let finalQuestion = { ...q };

    // Transform image_url to public HTTPS Firebase Storage URL
    if (q.image_url && typeof q.image_url === 'string') {
      const encodedFilename = encodeURIComponent(q.image_url);
      finalQuestion.image_url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedFilename}?alt=media`;
    }

    // Add server timestamp
    finalQuestion.created_at = admin.firestore.FieldValue.serverTimestamp();

    return finalQuestion;
  });

  console.log('--- Starting Firestore Upload ---');

  const collectionName = 'Assessments_Bank';
  const BATCH_LIMIT = 400; // Firestore limit is 500, using 400 for safety

  for (let i = 0; i < processedQuestions.length; i += BATCH_LIMIT) {
    const chunk = processedQuestions.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();

    chunk.forEach((question) => {
      // Use question_id as the document ID
      const docRef = db.collection(collectionName).doc(question.question_id);
      batch.set(docRef, question);
    });

    try {
      await batch.commit();
      console.log(`[UPLOAD] Committed batch ${Math.floor(i / BATCH_LIMIT) + 1} (${chunk.length} items)`);
    } catch (error) {
      console.error(`[FATAL ERROR] Batch upload failed at index ${i}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n--- Seeding Process Complete ---');
  console.log(`Successfully migrated ${processedQuestions.length} questions to '${collectionName}' collection.`);
}

seedDatabase().catch((err) => {
  console.error('An unexpected error occurred during seeding:', err);
  process.exit(1);
});
