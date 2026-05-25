const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// Connect to your secure admin key
const serviceAccount = require('../../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth(); // We need the Auth module to create secure login credentials

async function bulkCreateStudents() {
  console.log("🔍 Reading roseville_enugu_credentials.csv...");
  const studentsToCreate = [];

  // 1. Read the updated CSV file
  fs.createReadStream(__dirname + '/roseville_enugu_credentials.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.Email && row.Password && row.Name) {
        studentsToCreate.push(row);
      }
    })
    .on('end', async () => {
      console.log(`✅ Found ${studentsToCreate.length} students. Beginning account creation...`);
      
      let successCount = 0;
      let errorCount = 0;

      // 2. Loop through and create each account sequentially
      for (const student of studentsToCreate) {
        try {
          // Create the authentication login
          const userRecord = await auth.createUser({
            email: student.Email.trim(),
            password: student.Password.trim(),
            displayName: student.Name.trim(),
          });

          // Create the database profile using their new secure Auth ID
          await db.collection('Students').doc(userRecord.uid).set({
            name: student.Name.trim(),
            email: student.Email.trim(),
            gender: student.Gender ? student.Gender.trim().toLowerCase() : '',
            classLevel: 'JSS 3',
            // THE NEW IDENTIFIER:
            organizationId: 'Roseville School, Enugu', 
            isTestCompleted: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`🟢 Success: Created account for ${student.Name}`);
          successCount++;
        } catch (error) {
          console.error(`🔴 Error creating ${student.Email}:`, error.message);
          errorCount++;
        }
      }

      console.log(`\n🎉 Bulk Upload Complete!`);
      console.log(`Successfully created: ${successCount}`);
      console.log(`Errors: ${errorCount}`);
      process.exit(0);
    });
}

bulkCreateStudents();