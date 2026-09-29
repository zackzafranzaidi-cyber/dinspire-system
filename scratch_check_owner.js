const fs = require('fs');
const content = fs.readFileSync('routes/owner.js', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('router.get(') && lines[lines.indexOf(l)+1].includes('"/dashboard"'));
console.log(lines.slice(start, start + 30).join('\n'));
