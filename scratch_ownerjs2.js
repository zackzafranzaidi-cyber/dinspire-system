const fs = require('fs');
const content = fs.readFileSync('routes/owner.js', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('commissionPercent'));
console.log(lines.slice(start + 10, start + 70).join('\n'));
