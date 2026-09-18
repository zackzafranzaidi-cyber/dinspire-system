const fs = require('fs');
const js = fs.readFileSync('routes/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('from("product_orders")'));
console.log(lines.slice(Math.max(0, idx - 10), idx + 30).join('\n'));
