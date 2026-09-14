const fs = require('fs');
const content = fs.readFileSync('routes/admin.js', 'utf8');
const match = content.match(/router\.get\(\s*\"\/data\"[\s\S]*?\}\);/);
if(match) {
  const parts = match[0].split('let posters = [];');
  console.log(parts.length > 1 ? parts[1] : match[0]);
}
