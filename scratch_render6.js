const fs = require('fs');
const js = fs.readFileSync('public/owner/js/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function renderTxProdukTable'));
console.log(lines.slice(idx, idx + 80).join('\n'));
