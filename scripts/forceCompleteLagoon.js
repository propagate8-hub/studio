const admin = require('firebase-admin');
const path = require('path');

// Connect securely
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(keyPath);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function nuclearSweep() {
  console.log("Initiating Nuclear Sweep for Lagoon School...");
  
  const snapshot = await db.collection('Students')
    .where('organizationId', '==', 'Lagoon School, Lekki')
    .get();

  let recoveredCount = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    
    // If they are not strictly marked as true...
    if (data.isTestCompleted !== true) {
      
      // If finalAnswers simply exists (we don't care what data type it is)
      if (data.finalAnswers !== undefined && data.finalAnswers !== null) {
        
        batch.update(doc.ref, { 
          isTestCompleted: true,
          recoveredByAdmin: true 
        });
        
        console.log(`Rescued Record: ${data.name || doc.id}`);
        recoveredCount++;
      }
    }
  });

  if (recoveredCount > 0) {
    await batch.commit();
    console.log(`\n✅ BOOM. Successfully forced ${recoveredCount} records into the completed queue.`);
    console.log("Head over to the Batch Operations Center—they are waiting for you!");
  } else {
    console.log("Sweep complete. If this says 0, the database is haunted.");
  }
}

nuclearSweep();