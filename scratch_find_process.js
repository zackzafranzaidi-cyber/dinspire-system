const fs = require('fs');
const content = fs.readFileSync('public/owner/js/owner.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('function processDashboardData'));
if (idx !== -1) console.log(lines.slice(idx, idx + 40).join('\n'));
else console.log("Not found");
