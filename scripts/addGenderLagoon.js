const admin = require('firebase-admin');
const path = require('path');

// Connect securely
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(keyPath);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function backfillGender() {
  console.log("Locating Lagoon School students to inject gender field...");
  
  const snapshot = await db.collection('Students')
    .where('organizationId', '==', 'Lagoon School, Lekki')
    .get();

  let updatedCount = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    // Inject the gender field into every profile
    batch.update(doc.ref, { 
      gender: 'Female' 
    });
    updatedCount++;
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`✅ SUCCESS! Added 'gender: "Female"' to ${updatedCount} students.`);
  } else {
    console.log("No students found.");
  }
}

backfillGender();