const fs = require('fs');
const js = fs.readFileSync('routes/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('"/verify-product-payment"'));
console.log(lines.slice(idx + 40, idx + 60).join('\n'));
