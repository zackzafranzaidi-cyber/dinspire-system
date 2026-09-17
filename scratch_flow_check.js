const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// The key question: Is there a try-catch around the DOMContentLoaded that would swallow errors?
// Find the async DOMContentLoaded
const asyncDom = js.indexOf('window.addEventListener("DOMContentLoaded", async () => {');
const block = js.substring(asyncDom, asyncDom + 100);
console.log('Async DOMContentLoaded starts with:', block);

// Check if there's a try block immediately after
const afterOpen = js.indexOf('{', asyncDom + 55);
const nextChars = js.substring(afterOpen + 1, afterOpen + 100).trim();
console.log('After opening brace:', nextChars.substring(0, 80));

// Now let's check what happens after fetchShopData
const fetchShopIdx = js.indexOf('await fetchShopData();');
console.log('\nAfter fetchShopData:');
console.log(js.substring(fetchShopIdx, fetchShopIdx + 300));
