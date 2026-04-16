const fs = require('fs');
const path = require('path');

// Read the key and instantly compress it into one line
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const rawData = fs.readFileSync(keyPath);
const flatKey = JSON.stringify(JSON.parse(rawData));

console.log("\n=== COPY EVERYTHING BELOW THIS LINE ===");
console.log(flatKey);
console.log("=== COPY EVERYTHING ABOVE THIS LINE ===\n");