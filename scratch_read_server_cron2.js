const fs = require('fs');
const js = fs.readFileSync('server.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('schedule.scheduleJob'));
console.log(lines.slice(idx, idx + 50).join('\n'));
