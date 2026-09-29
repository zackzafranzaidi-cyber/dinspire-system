const fs = require('fs');
const content = fs.readFileSync('public/owner/index.html', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('id="tab-transactions"'));
if (idx !== -1) console.log(lines.slice(idx, idx + 40).join('\n'));
else console.log("Not found");
