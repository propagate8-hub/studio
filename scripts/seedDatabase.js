const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * SEED SCRIPT FOR ACET QUESTIONS
 * This script runs in a Node.js environment and uses the Admin SDK
 * to bypass security rules and seed the database.
 */

// 1. Resolve path to the service account key at the project root
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`[ERROR] Service account key not found at: ${serviceAccountPath}`);
  console.error('Please ensure you have placed your serviceAccountKey.json file in the root directory.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// 2. Initialize Firebase Admin
// The Admin SDK bypasses security rules, so PERMISSION_DENIED usually indicates
// an issue with the service account credentials themselves or the Project ID.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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
  
  if (allQuestions.length === 0) {
    console.error('[ERROR] No questions found to upload. Exiting.');
    return;
  }

  console.log('--- Starting Image URL Transformation ---');

  // Use the bucket name derived from the project ID
  const storageBucket = 'studio-8583003732-8c0f2.firebasestorage.app';
  
  const processedQuestions = allQuestions.map((q) => {
    let finalQuestion = { ...q };

    // Transform image_url to public HTTPS Firebase Storage URL if it exists
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
      // Use question_id as the document ID for uniqueness and easy lookup
      // Default to a generated ID if question_id is somehow missing
      const docId = question.question_id || db.collection(collectionName).doc().id;
      const docRef = db.collection(collectionName).doc(docId);
      batch.set(docRef, question);
    });

    try {
      await batch.commit();
      console.log(`[UPLOAD] Committed batch ${Math.floor(i / BATCH_LIMIT) + 1} (${chunk.length} items)`);
    } catch (error) {
      console.error(`[FATAL ERROR] Batch upload failed at index ${i}:`, error.message);
      console.error('This error might be due to service account permissions or project mismatch.');
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
