const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');

// Remove redundant const and function
code = code.replace(/const IS_LOCALHOST =[\s\S]*?;\n/, '');
code = code.replace(/const API_BASE_URL =[\s\S]*?;\n/, '');
code = code.replace(/\/\/ \[DIBAIKI\] Fungsi keselamatan XSS\s*function escapeHTML\(str\) \{[\s\S]*?\}\n/, '');

fs.writeFileSync('public/js/admin.js', code);
