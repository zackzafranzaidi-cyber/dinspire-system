const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function requestOTP'));
console.log(lines.slice(idx, idx + 40).join('\n'));
