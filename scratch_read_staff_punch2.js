const fs = require('fs');
const js = fs.readFileSync('routes/staff.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('"/punch"'));
console.log(lines.slice(Math.max(0, idx - 2), idx + 80).join('\n'));
