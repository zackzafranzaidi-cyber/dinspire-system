const fs = require('fs');
const js = fs.readFileSync('public/owner/js/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('Product Orders') || l.includes('OrdersList') || l.includes('tab-products'));
console.log(lines.slice(Math.max(0, idx - 5), idx + 80).join('\n'));
