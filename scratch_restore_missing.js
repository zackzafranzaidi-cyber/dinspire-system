const fs = require('fs');
const { execSync } = require('child_process');

const oldJs = execSync('git show edb88e0:public/customer/js/index.js', { encoding: 'utf8', maxBuffer: 1024*1024 });

// Extract the functions using regex or index
function extractFunction(name) {
  const startStr = `function ${name}(`;
  let startIdx = oldJs.indexOf(startStr);
  if (startIdx === -1) {
      // try async
      startIdx = oldJs.indexOf(`async function ${name}(`);
  }
  if (startIdx === -1) return null;
  
  let openBraces = 0;
  let inFunc = false;
  let endIdx = -1;
  
  for (let i = startIdx; i < oldJs.length; i++) {
    if (oldJs[i] === '{') {
      openBraces++;
      inFunc = true;
    } else if (oldJs[i] === '}') {
      openBraces--;
      if (inFunc && openBraces === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  
  return endIdx !== -1 ? oldJs.substring(startIdx, endIdx) : null;
}

const missingFuncs = [
  'triggerResetBooking', 
  'fetchBarberAvailabilityForReset', 
  'submitResetBooking', 
  'renderDesktopCartItems', 
  'openEditProfileModal'
];

let toAppend = "\n\n// RESTORED MISSING FUNCTIONS\n";
for (const func of missingFuncs) {
  const code = extractFunction(func);
  if (code) {
    toAppend += code + "\n\n";
  } else {
    console.log("Could not extract", func);
  }
}

// Write to end of customer.js
const newJs = fs.readFileSync('public/customer/js/customer.js', 'utf8');
fs.writeFileSync('public/customer/js/customer.js', newJs + toAppend);
console.log("Appended missing functions to customer.js");
