const fs = require('fs');
const js = fs.readFileSync('routes/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('"/reassign-booking"'));
console.log(lines.slice(idx, idx + 40).join('\n'));
