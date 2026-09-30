const fs = require('fs');
const content = fs.readFileSync('routes/admin.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const ['));
if (idx !== -1) console.log(lines.slice(idx, idx + 20).join('\n'));
else console.log("Not found");
