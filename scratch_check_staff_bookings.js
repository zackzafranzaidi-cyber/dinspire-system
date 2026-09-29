const fs = require('fs');
const content = fs.readFileSync('routes/staff.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('bookings: '));
if (idx !== -1) console.log(lines.slice(idx-5, idx + 15).join('\n'));
else console.log("Not found");
