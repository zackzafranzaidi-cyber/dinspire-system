const fs = require('fs');
const js = fs.readFileSync('routes/staff.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('router.post("/punch"'));
console.log(lines.slice(idx, idx + 40).join('\n'));
