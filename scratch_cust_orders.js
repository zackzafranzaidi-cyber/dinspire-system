const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function renderProductOrders('));
console.log(lines.slice(Math.max(0, idx - 2), idx + 50).join('\n'));
