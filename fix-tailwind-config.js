const fs = require('fs');
const path = require('path');

// Path to the tailwind.config.ts file
const tailwindConfigPath = path.join(__dirname, 'tailwind.config.ts');

// Read the current content
let content = fs.readFileSync(tailwindConfigPath, 'utf8');

// Replace the import statement to add resolution-mode
const originalImport = 'import type { Config } from "tailwindcss";';
const fixedImport = 'import type { Config } from "tailwindcss" with { "resolution-mode": "import" };';

// Replace the import statement
content = content.replace(originalImport, fixedImport);

// Write the updated content back to the file
fs.writeFileSync(tailwindConfigPath, content);

console.log('Fixed tailwind.config.ts import with resolution-mode attribute'); 