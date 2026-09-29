const fs = require('fs');
const content = fs.readFileSync('routes/staff.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('table_name: "walkin_records"'));
if (idx !== -1) console.log(lines.slice(idx-2, idx + 8).join('\n'));
else console.log("Not found");
