const fs = require('fs');
const js = fs.readFileSync('public/staff/js/staff.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function verifyPayment'));
console.log(lines.slice(Math.max(0, idx - 10), idx + 20).join('\n'));
