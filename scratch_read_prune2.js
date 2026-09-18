const fs = require('fs');
const js = fs.readFileSync('utils/archiver.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('async function pruneYearlyData'));
console.log(lines.slice(idx + 10, idx + 40).join('\n'));
