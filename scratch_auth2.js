const fs = require('fs');
const js = fs.readFileSync('routes/auth.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function formatPhone('));
console.log(lines.slice(Math.max(0, idx - 5), idx + 20).join('\n'));
