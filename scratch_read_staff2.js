const fs = require('fs');
const js = fs.readFileSync('routes/staff.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('router.post("/leaves"'));
console.log(lines.slice(idx + 40, idx + 80).join('\n'));
