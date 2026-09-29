const fs = require('fs');
const content = fs.readFileSync('routes/owner.js', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('peratus_komisen'));
console.log(lines.slice(start - 20, start + 20).join('\n'));
