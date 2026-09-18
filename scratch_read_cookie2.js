const fs = require('fs');
const js = fs.readFileSync('routes/auth.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('cookieOptions'));
console.log(lines.slice(Math.max(0, idx - 10), idx + 20).join('\n'));
