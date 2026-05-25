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

async function patchStudents() {
  console.log("🔍 Patching student accounts to match frontend architecture...");
  const updates = [];

  // 1. Read your existing CSV file
  fs.createReadStream(__dirname + '/roseville_enugu_credentials.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.Email && row.Password) {
        updates.push(row);
      }
    })
    .on('end', async () => {
      // 2. Fetch the 57 students we created earlier
      const snapshot = await db.collection('Students').where('organizationId', '==', 'Roseville School, Enugu').get();
      
      let count = 0;
      const batch = db.batch();

      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Match them by email
        const match = updates.find(u => u.Email.toLowerCase().trim() === data.email.toLowerCase().trim());
        
        if (match) {
          // 3. Inject the EXACT fields your frontend code is looking for!
          batch.update(doc.ref, {
            acetId: match.Email.toUpperCase().trim(), // Makes it uppercase to match Line 93!
            accessCode: match.Password.trim()         // Saves the password for the query
          });
          count++;
        }
      });

      await batch.commit();
      console.log(`✅ Successfully patched ${count} students! They can log in RIGHT NOW.`);
      process.exit(0);
    });
}

patchStudents();