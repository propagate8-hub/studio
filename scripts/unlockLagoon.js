const admin = require('firebase-admin');
const path = require('path');

// 1. Connect securely
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(keyPath);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function unlockCohort() {
  console.log("Locating Lagoon School students...");
  
  // 🚨 CHANGE 'Lagoon School' to the exact name you used when you generated their IDs!
  const snapshot = await db.collection('Students')
    .where('organizationId', '==', 'Lagoon School, Lekki')
    .get();

  if (snapshot.empty) {
    console.log("No students found. Check the exact spelling of the school name!");
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    // This flips the lock back to open without touching their saved answers!
    batch.update(doc.ref, { isTestCompleted: false }); 
  });

  await batch.commit();
  console.log(`✅ SUCCESS! Unlocked ${snapshot.size} students.`);
}

unlockCohort();