const fs = require('fs');
const js = fs.readFileSync('routes/shop.js', 'utf8');
const lines = js.split('\n');
console.log(lines.slice(0, 100).join('\n'));
