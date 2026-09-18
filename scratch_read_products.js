const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('router.post(\'/products\''));
if(idx === -1) idx = lines.findIndex(l => l.includes('/products'));
console.log(lines.slice(Math.max(0, idx - 2), idx + 80).join('\n'));
