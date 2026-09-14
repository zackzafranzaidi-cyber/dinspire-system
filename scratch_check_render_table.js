const fs = require('fs');
const content = fs.readFileSync('public/js/owner_cms.js', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('function renderTable(tabName)'));
console.log(lines.slice(startIndex + 30, startIndex + 80).join('\n'));
