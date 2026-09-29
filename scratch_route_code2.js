const fs = require('fs');
const content = fs.readFileSync('routes/staff.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('router.get(') && l.trim() === 'router.get(');
console.log(lines.slice(idx + 40, idx + 100).join('\n'));
