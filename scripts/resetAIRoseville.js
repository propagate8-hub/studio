const admin = require('firebase-admin');
const path = require('path');

// Connect securely
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(keyPath);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function resetAILagoon() {
  console.log("Locating Lagoon School students with corrupted pronouns...");
  
  const snapshot = await db.collection('Students')
    .where('organizationId', '==', 'Roseville Secondary School')
    .get();

  let resetCount = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    
    // If they have AI data generated, we delete ONLY the AI data
    if (data.aiReportData) {
      batch.update(doc.ref, { 
        aiReportData: admin.firestore.FieldValue.delete() 
      });
      resetCount++;
    }
  });

  if (resetCount > 0) {
    await batch.commit();
    console.log(`\n✅ SUCCESS! Wiped the AI text for ${resetCount} students.`);
    console.log("Their test scores are perfectly safe.");
  } else {
    console.log(`SUCCESS! Wiped the AI text for ${count} Roseville students.`);
  }
}

resetAILagoon();