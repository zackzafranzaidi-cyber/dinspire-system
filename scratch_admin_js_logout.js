const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');
code = code.replace(/logoutAdmin\(\)/g, 'if(typeof logoutOwner === "function") logoutOwner();');
fs.writeFileSync('public/js/admin.js', code);
