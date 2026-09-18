const fs = require('fs');
const js = fs.readFileSync('routes/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('"/cancel-booking-admin"'));
console.log(lines.slice(idx, idx + 40).join('\n'));
