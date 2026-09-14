const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

// Use regex to remove these safely regardless of CRLF
code = code.replace(/const IS_LOCALHOST =[\s\S]*?;\s*const API_BASE_URL =[\s\S]*?;\n?/, '');

code = code.replace(/\/\/ \[DIBAIKI\] Fungsi keselamatan XSS\s*function escapeHTML\(str\) \{[\s\S]*?return String\(str\)\.replace\(\/\[&<>'\"\]\/g, \(tag\) => charsToReplace\[tag\] \|\| tag\);\s*\}/, '');

fs.writeFileSync('public/js/owner_cms.js', code);
