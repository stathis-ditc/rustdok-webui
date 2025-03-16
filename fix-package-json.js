const fs = require('fs');
const path = require('path');

// Read the existing package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add the type field if it doesn't exist
if (!packageJson.type) {
  packageJson.type = 'module';
}

// Write the updated package.json back to the file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Added "type": "module" to package.json'); 