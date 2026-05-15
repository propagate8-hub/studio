const admin = require('firebase-admin');

// 1. Point directly to the JSON file you just downloaded
const serviceAccount = require('./serviceAccountKey.json'); 

// 2. Initialize Firebase Admin using the file
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function setGenderToFemale() {
  console.log("🔍 Searching for Roseville Secondary School students...");
  
  try {
    const studentsRef = db.collection('Students');
    const q = studentsRef.where('organizationId', '==', 'Roseville Secondary School');
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.log("⚠️ No students found for Roseville Secondary School.");
      return;
    }

    console.log(`✅ Found ${snapshot.size} students. Injecting gender data...`);

    // We use a Firestore Batch to update all 57 students simultaneously
    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { gender: 'female' });
      count++;
    });

    await batch.commit();
    console.log(`🎉 Success! Automatically updated ${count} students with gender: 'female'.`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error updating students:", error);
    process.exit(1);
  }
}

setGenderToFemale();