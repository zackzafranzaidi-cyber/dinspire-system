const fs = require('fs');
let code = fs.readFileSync('public/js/admin_backup.js', 'utf8');

// Rename switchTab
code = code.replace(/function switchTab/g, 'function switchAdminTab');
code = code.replace(/switchTab\(/g, 'switchAdminTab(');

// Remove init logic
code = code.replace(/document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/g, `
// Modified for Owner Integration
function initAdminCMS() {
    if (typeof API_BASE_URL === 'undefined') window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api';
    loadAdminData();
}
`);

// 3. Remove loginAdmin and logoutAdmin exactly
const lines = code.split('\n');
let newLines = [];
let skip = false;
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('async function loginAdmin(allowedRoles)')) skip = true;
    if (lines[i].includes('let globalLoaderStartTime = Date.now();')) skip = true;
    if (lines[i].includes('function logoutAdmin()')) skip = true;
    
    if (!skip) newLines.push(lines[i]);
    
    if (skip && lines[i].startsWith('}')) {
        // We only stop skipping if the line is exactly '}' (end of top level function)
        // Actually, loginAdmin has a catch block that ends with `  }`.
        if (lines[i] === '}') {
            skip = false;
        }
    }
}
code = newLines.join('\n');

// 5. Replace logoutAdmin calls
code = code.replace(/logoutAdmin\(\)/g, 'if(typeof logoutOwner === "function") logoutOwner();');

// 6. Replace fetchData calls
code = code.replace(/fetchData\(\)/g, 'loadAdminData()');

fs.writeFileSync('public/js/admin.js', code);
