const fs = require('fs');
const path = require('path');

// Read the existing tsconfig.json
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

// Update the configuration
if (!tsconfig.compilerOptions) {
  tsconfig.compilerOptions = {};
}

// Set moduleResolution to NodeNext
tsconfig.compilerOptions.moduleResolution = 'NodeNext';

// Add module type if it doesn't exist
if (!tsconfig.compilerOptions.module) {
  tsconfig.compilerOptions.module = 'NodeNext';
}

// Add resolution mode attribute for imports
if (!tsconfig.compilerOptions.resolvePackageJsonImports) {
  tsconfig.compilerOptions.resolvePackageJsonImports = true;
}

// Write the updated config back to the file
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

console.log('TypeScript configuration updated successfully.'); 