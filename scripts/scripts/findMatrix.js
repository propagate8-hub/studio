const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function findImageQuestions() {
  console.log("🔍 Scanning the databank for visual/matrix questions...");
  
  try {
    // NOTE: Change 'Questions' if your database collection has a different name!
    const snapshot = await db.collection('Questions').get();
    
    let found = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // We look for any field that might contain the image or the word "matrix"
      const hasImageField = data.imageUrl || data.image || data.media;
      const hasMatrixKeyword = data.question && data.question.toLowerCase().includes('matrix');
      
      if (hasImageField || hasMatrixKeyword) {
        console.log(`\n✅ FOUND MATCH!`);
        console.log(`- Document ID: ${doc.id}`);
        console.log(`- Question Text: ${data.question || 'N/A'}`);
        console.log(`- Image Link: ${data.imageUrl || data.image || data.media || 'No direct link found'}`);
        found++;
      }
    });

    if (found === 0) {
      console.log("\n❌ Scan complete. No images or matrix questions found.");
    } else {
      console.log(`\n🎉 Scan complete. Found ${found} visual questions.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error scanning database:", error);
    process.exit(1);
  }
}

findImageQuestions();