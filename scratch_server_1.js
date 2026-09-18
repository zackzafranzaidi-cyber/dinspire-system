const fs = require('fs');
const js = fs.readFileSync('server.js', 'utf8');
const lines = js.split('\n');
console.log(lines.slice(0, 150).join('\n'));
