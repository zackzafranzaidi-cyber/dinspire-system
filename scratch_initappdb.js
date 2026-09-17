const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Check if initAppDb exists and works
const initAppDbIdx = js.indexOf('function initAppDb()');
console.log('=== initAppDb ===');
console.log(js.substring(initAppDbIdx, initAppDbIdx + 500));
