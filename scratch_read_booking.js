const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('router.post(') && !l.includes('/products') && !l.includes('/webhook/fpx') && !l.includes('/walkin') && !l.includes('/oncall'));
console.log(lines.slice(idx, idx + 100).join('\n'));
