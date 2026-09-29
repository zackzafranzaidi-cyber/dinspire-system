const fs = require('fs');
const content = fs.readFileSync('routes/admin.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('.from("staff").select("*")'));
if (idx !== -1) console.log(lines.slice(idx - 5, idx + 5).join('\n'));
else console.log("Not found");
