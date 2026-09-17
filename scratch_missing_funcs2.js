const fs = require('fs');

// Get old file from git directly
const { execSync } = require('child_process');
const oldJs = execSync('git show edb88e0:public/customer/js/index.js', { encoding: 'utf8', maxBuffer: 1024*1024 });
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
    const isCalled = newJs.includes(func + '(') || newJs.includes(func + ' (');
    missing.push(func + (isCalled ? ' *** CALLED but MISSING! ***' : ' (not called)'));
  }
}

console.log('Functions in old:', oldFuncs.size);
console.log('Functions in new:', newFuncs.size);
console.log('\nMissing functions:');
missing.forEach(f => console.log(' -', f));
