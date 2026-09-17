const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function switchView'));
console.log(lines.slice(idx + 10, idx + 30).join('\n'));
