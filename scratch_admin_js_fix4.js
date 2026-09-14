const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');

// I will just use regex to remove that specific line
code = code.replace(/^\}\s*$/m, '');

fs.writeFileSync('public/js/admin.js', code);
