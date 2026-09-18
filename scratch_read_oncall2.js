const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('"/oncall"'));
console.log(lines.slice(idx + 80, idx + 130).join('\n'));
