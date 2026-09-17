const fs = require('fs');
const html = fs.readFileSync('public/customer/index.html', 'utf8');
const lines = html.split('\n');
let idx = 0;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('id="home-view"')) { idx = i; break; }
}
console.log(lines.slice(idx, idx + 40).join('\n'));
