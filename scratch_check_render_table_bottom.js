const fs = require('fs');
const content = fs.readFileSync('public/js/owner_cms.js', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('let dataArr = appData[tabName] || [];'));
console.log(lines.slice(startIndex, startIndex + 60).join('\n'));
