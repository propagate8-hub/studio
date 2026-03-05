const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. FORCE THE VIP ADMIN CONNECTION
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(keyPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'studio-8583003732-8c0f2'
  });
}

const db = admin.firestore();

// 2. TARGET ONLY THE REMAINING FILES
const dataDir = path.resolve(__dirname, '../data');
const files = [
  'SpatialQ1-60.txt',
  'VerbalQ1-60.txt'
];

async function seedDatabase() {
  let allQuestions = [];

  // 3. READ AND BULLDOZER CLEAN
  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      let rawData = fs.readFileSync(filePath, 'utf-8');
      
      // --- THE BULLDOZER CLEANER ---
      // A. Flatten the entire file to a single line (Destroys illegal line breaks in strings!)
      rawData = rawData.replace(/[\n\r]+/g, ' ');
      
      // B. Strip out the tags
      rawData = rawData.replace(/\\s*/g, '');
      
      // C. Fix multiple arrays: replace "]" followed by "[" with a comma
      rawData = rawData.replace(/\]\s*,?\s*\[/g, ',');
      
      // D. Fix manual edit errors: replace "]" followed by "{" with ", {"
      rawData = rawData.replace(/\]\s*\{/g, ', {');
      
      // E. Ensure the file ends properly
      rawData = rawData.trim();
      if (rawData.endsWith('}')) {
          rawData += ']';
      } else if (rawData.endsWith(',')) {
          rawData = rawData.slice(0, -1) + ']';
      }
      
      // F. Ensure it starts properly
      if (!rawData.startsWith('[')) {
          rawData = '[' + rawData;
      }
      // -------------------------------

      const parsedData = JSON.parse(rawData);
      allQuestions = allQuestions.concat(parsedData);
      console.log(`✅ Successfully parsed and bulldozed: ${file}`);
    } catch (error) {
      console.error(`❌ FAILED to parse ${file}. Error:`, error.message);
    }
  }

  console.log(`\n📦 Total questions ready for upload: ${allQuestions.length}\n`);
  if (allQuestions.length === 0) return;

  // 4. BATCH UPLOAD TO FIRESTORE
  const batches = [];
  let currentBatch = db.batch();
  let operationCounter = 0;

  for (const q of allQuestions) {
    if (q.image_url && !q.image_url.startsWith('http')) {
       q.image_url = `https://firebasestorage.googleapis.com/v0/b/studio-8583003732-8c0f2.firebasestorage.app/o/${q.image_url}?alt=media`;
    }

    const docRef = db.collection('Assessments_Bank').doc(q.question_id);
    const uploadData = { ...q, created_at: admin.firestore.FieldValue.serverTimestamp() };

    currentBatch.set(docRef, uploadData);
    operationCounter++;

    if (operationCounter === 400) {
      batches.push(currentBatch.commit());
      currentBatch = db.batch();
      operationCounter = 0;
      console.log('⏳ Committing batch of 400...');
    }
  }

  if (operationCounter > 0) {
    batches.push(currentBatch.commit());
    console.log(`⏳ Committing final batch of ${operationCounter}...`);
  }

  try {
    await Promise.all(batches);
    console.log('\n🎉 SUCCESS! The final files have been securely migrated to Firestore!');
  } catch (error) {
    console.error('\n🔥 [FATAL ERROR] Batch upload failed:', error);
  }
}

seedDatabase();