const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
console.log(lines.slice(25, 45).join('\n'));
