const fs = require('fs');
const js = fs.readFileSync('routes/admin.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('"/staff/:id/capabilities"'));
console.log(lines.slice(idx, idx + 20).join('\n'));
