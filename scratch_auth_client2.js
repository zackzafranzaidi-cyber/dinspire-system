const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('/request-otp'));
console.log(lines.slice(Math.max(0, idx - 10), idx + 20).join('\n'));
