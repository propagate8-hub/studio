const admin = require('firebase-admin');
const path = require('path');

// Connect securely
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(keyPath);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function checkLiveExamStatus() {
  console.log("Fetching live exam data for Lagoon School...");
  
  // Change 'Lagoon School' if your CSV spelling was different!
  const snapshot = await db.collection('Students')
    .where('organizationId', '==', 'Lagoon School, Lekki')
    .get();

  let total = snapshot.size;
  let completed = 0;
  let stillTesting = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.isTestCompleted === true) {
      completed++;
    } else {
      stillTesting++;
    }
  });

  console.log("\n=================================");
  console.log("🏫 LAGOON SCHOOL LIVE EXAM REPORT");
  console.log("=================================");
  console.log(`Total Students Enrolled : ${total}`);
  console.log(`✅ Finished & Locked    : ${completed}`);
  console.log(`⏳ Actively Testing     : ${stillTesting}`);
  console.log("=================================\n");
}

checkLiveExamStatus();