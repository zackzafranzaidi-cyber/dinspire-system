const fs = require('fs');
const content = fs.readFileSync('public/owner/js/owner.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('let exp = price * (getStaffCommissionRate'));
if (idx !== -1) console.log(lines.slice(idx - 10, idx + 10).join('\n'));
else console.log("Not found");
