const fs = require('fs');
const content = fs.readFileSync('routes/admin.js', 'utf8');
const match = content.match(/router\.get\(\s*\"\/data\"[\s\S]*?\}\);/);
if(match) console.log(match[0]);
