const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const idx = js.indexOf('function playGreetingAnimation');
console.log(js.substring(idx + 500, idx + 1500));
