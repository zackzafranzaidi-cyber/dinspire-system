const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');

// 1. Rename switchTab -> switchAdminTab
code = code.replace(/function switchTab/g, 'function switchAdminTab');
code = code.replace(/switchTab\(/g, 'switchAdminTab(');

// 2. Remove init logic and replace with initAdminCMS
code = code.replace(/document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/g, `
// Modified for Owner Integration
function initAdminCMS() {
    if (typeof API_BASE_URL === 'undefined') window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api';
    loadAdminData();
}
`);

// 3. Remove loginAdmin and logoutAdmin
// Let's just find them using regex so we don't slice blindly.
code = code.replace(/async function loginAdmin\(allowedRoles\)\s*\{[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}\s*btn\.innerText = "Log Masuk";\s*\}/, '');
code = code.replace(/function logoutAdmin\(\)\s*\{[\s\S]*?\}\s*\}/, '');

// 4. Remove showGlobalLoader and hideGlobalLoader definitions
code = code.replace(/let globalLoaderStartTime = Date\.now\(\);\s*function showGlobalLoader\(\)\s*\{[\s\S]*?\}\s*function hideGlobalLoader\(\)\s*\{[\s\S]*?300\);\s*\}\s*\}/, '');

// 5. Replace logoutAdmin calls with logoutOwner
code = code.replace(/logoutAdmin\(\)/g, 'if(typeof logoutOwner === "function") logoutOwner();');

// 6. Replace fetchData calls
code = code.replace(/fetchData\(\);/g, 'loadAdminData();');

fs.writeFileSync('public/js/admin.js', code);
