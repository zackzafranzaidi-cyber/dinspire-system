const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Find ALL closing of DOMContentLoaded
let searchFrom = js.indexOf('window.addEventListener("DOMContentLoaded", async () => {');
console.log('=== DOMContentLoaded async block starts at:', searchFrom);

// Count braces to find the actual end
let depth = 0;
let started = false;
let endPos = -1;
for (let i = searchFrom; i < js.length; i++) {
  if (js[i] === '{') { depth++; started = true; }
  if (js[i] === '}') { 
    depth--;
    if (started && depth === 0) {
      endPos = i;
      break;
    }
  }
}
console.log('Block ends at:', endPos);
console.log('Last 200 chars of block:', js.substring(endPos - 200, endPos + 10));
