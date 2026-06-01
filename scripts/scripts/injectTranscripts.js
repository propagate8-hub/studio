const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function injectScores() {
  console.log("🔍 Fetching Roseville School, Enugu students...");
  const snapshot = await db.collection('Students').where('organizationId', '==', 'Roseville School, Enugu').get();
  
  const dbStudents = [];
  snapshot.forEach(doc => dbStudents.push({ id: doc.id, ...doc.data() }));

  const updates = [];
  
  fs.createReadStream(__dirname + '/roseville_transcript.csv')
    .pipe(csv())
    .on('data', (row) => {
      // Assuming your CSV has a 'Name' column. We convert both to lowercase to find a match.
      const csvName = row['Name']; 
      if(!csvName) return;

      const match = dbStudents.find(s => s.name.toLowerCase().trim() === csvName.toLowerCase().trim());
      
      if (match) {
        updates.push({
          docId: match.id,
          internalScores: {
            // NOTE: You will need to change these labels to match your exact CSV headers!
            Maths: row['Maths'] || "N/A",
            English: row['English'] || "N/A",
            Science: row['Basic Science'] || "N/A",
          }
        });
      }
    })
    .on('end', async () => {
      console.log(`🚀 Found ${updates.length} matches. Injecting scores into database...`);
      const batch = db.batch();
      updates.forEach(update => {
        batch.update(db.collection('Students').doc(update.docId), { internalScores: update.internalScores });
      });
      await batch.commit();
      console.log(`🎉 Success! Uploaded internal scores for ${updates.length} students.`);
      process.exit(0);
    });
}

injectScores();