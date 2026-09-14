const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');

// Strip the leftover lines
code = code.replace(/\/auth\/logout-sys`,\s*\{\s*method:\s*"POST",\s*credentials:\s*"include",\s*\}\)\s*\.catch\(\(e\)\s*=>\s*console\.error\(e\)\)\s*\.finally\(\(\)\s*=>\s*\{\s*localStorage\.removeItem\("din_admin_logged"\);\s*location\.reload\(\);\s*\}\);/g, '');
code = code.replace(/}\s*$/, ''); // It might leave an extra }

fs.writeFileSync('public/js/admin.js', code);
