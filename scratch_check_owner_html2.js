const fs = require('fs');
const content = fs.readFileSync('public/owner/index.html', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('Orders & Flow'));
if (idx !== -1) console.log(lines.slice(idx - 5, idx + 25).join('\n'));
else console.log("Not found");
