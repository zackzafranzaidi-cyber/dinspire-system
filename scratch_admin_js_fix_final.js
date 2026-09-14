const fs = require('fs');
let code = fs.readFileSync('public/js/admin_backup.js', 'utf8');

// 1. Rename switchTab -> switchAdminTab
code = code.replace(/function switchTab/g, 'function switchAdminTab');
code = code.replace(/switchTab\(/g, 'switchAdminTab(');

// 2. Remove init logic and replace with initAdminCMS
code = code.replace(/document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/g, `
// Modified for Owner Integration
function initAdminCMS() {
    loadAdminData();
}
`);

// 3. Strip duplicate constants and functions
code = code.replace(/const IS_LOCALHOST =[\s\S]*?;\n/g, '');
code = code.replace(/const API_BASE_URL =[\s\S]*?;\n/g, '');
code = code.replace(/\/\/ \[DIBAIKI\] Fungsi keselamatan XSS\s*function escapeHTML\(str\) \{[\s\S]*?\}\n/g, '');

// 4. Remove loginAdmin, logoutAdmin, showGlobalLoader, hideGlobalLoader safely
const lines = code.split('\n');
let newLines = [];
let skip = false;
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('async function loginAdmin(allowedRoles)')) skip = true;
    if (lines[i].includes('let globalLoaderStartTime = Date.now();')) skip = true;
    if (lines[i].includes('function logoutAdmin()')) skip = true;
    
    if (!skip) newLines.push(lines[i]);
    
    if (skip && lines[i].trim() === '}') {
        skip = false;
    }
}
code = newLines.join('\n');

// 5. Replace logoutAdmin calls
code = code.replace(/logoutAdmin\(\)/g, 'if(typeof logoutOwner === "function") logoutOwner();');

// 6. Replace fetchData calls
code = code.replace(/fetchData\(\)/g, 'loadAdminData()');

fs.writeFileSync('public/js/admin.js', code);
