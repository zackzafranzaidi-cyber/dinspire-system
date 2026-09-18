const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('"/order/:orderNo/complete"'));
console.log(lines.slice(idx, idx + 40).join('\n'));
