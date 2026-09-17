const fs = require('fs');
const oldJs = fs.readFileSync('scratch_old_index.js', 'utf16le');
const newJs = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Find all function definitions in old
const oldFuncs = new Set();
const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
let match;
while ((match = funcRegex.exec(oldJs)) !== null) {
  oldFuncs.add(match[1]);
}

// Find all function definitions in new
const newFuncs = new Set();
const funcRegex2 = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
while ((match = funcRegex2.exec(newJs)) !== null) {
  newFuncs.add(match[1]);
}

// Find functions that exist in old but not in new
const missing = [];
for (const func of oldFuncs) {
  if (!newFuncs.has(func)) {
    // Check if the function is actually called in the new file
    if (newJs.includes(func)) {
      missing.push(func + ' (CALLED but MISSING!)');
    } else {
      missing.push(func + ' (not called)');
    }
  }
}

console.log('Missing functions:');
missing.forEach(f => console.log(' -', f));
