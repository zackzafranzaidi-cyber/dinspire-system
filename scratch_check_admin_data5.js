const fs = require('fs');
const content = fs.readFileSync('routes/admin.js', 'utf8');
const index = content.indexOf('can_haircut:');
console.log(content.substring(index, index + 800));
