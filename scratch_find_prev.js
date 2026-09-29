const fs = require('fs');
const content = fs.readFileSync('public/owner/js/owner.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('prevBookings.forEach'));
if (idx !== -1) console.log(lines.slice(idx - 20, idx + 20).join('\n'));
else console.log("Not found");
