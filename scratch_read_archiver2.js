const fs = require('fs');
const js = fs.readFileSync('utils/archiver.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function generateArchiveDataByDateRange'));
console.log(lines.slice(idx, idx + 50).join('\n'));
