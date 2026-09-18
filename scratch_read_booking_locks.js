const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('router.post("/", authenticate'));
console.log(lines.slice(idx + 50, idx + 100).join('\n'));
