const fs = require('fs');
const content = fs.readFileSync('routes/staff.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(320, 340).join('\n'));
