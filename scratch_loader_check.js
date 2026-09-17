const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Check showGlobalLoader and hideGlobalLoader
const showIdx = js.indexOf('function showGlobalLoader');
console.log('=== showGlobalLoader ===');
console.log(js.substring(showIdx, showIdx + 300));

const hideIdx = js.indexOf('function hideGlobalLoader');
console.log('\n=== hideGlobalLoader ===');
console.log(js.substring(hideIdx, hideIdx + 300));
