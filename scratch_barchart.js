const fs = require('fs');
const js = fs.readFileSync('public/owner/js/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function updateBarChart'));
console.log(lines.slice(idx, idx + 40).join('\n'));
