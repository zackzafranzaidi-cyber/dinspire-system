const fs = require('fs');
const content = fs.readFileSync('routes/admin.js', 'utf8');
const index = content.indexOf('settings.gaji_asas');
console.log(content.substring(index, index + 800));
