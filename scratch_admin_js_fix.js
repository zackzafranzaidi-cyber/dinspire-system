const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');

code = code.replace(/function switchTab/g, 'function switchAdminTab');
code = code.replace(/switchTab\(/g, 'switchAdminTab(');

code = code.replace(/document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/g, `
// Modified for Owner Integration
function initAdminCMS() {
    if (typeof API_BASE_URL === 'undefined') window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api';
    fetchData();
}
`);

// Simply remove showGlobalLoader and hideGlobalLoader definitions
// They are exactly these lines:
const loaderDefStart = code.indexOf('let globalLoaderStartTime');
const switchTabStart = code.indexOf('function switchAdminTab');
if (loaderDefStart !== -1 && switchTabStart !== -1) {
    code = code.slice(0, loaderDefStart) + code.slice(switchTabStart);
}

// Remove systemLogin function
const loginStart = code.indexOf('async function systemLogin()');
const logoutStart = code.indexOf('function logout()');
if (loginStart !== -1 && logoutStart !== -1) {
    // We want to remove from loginStart until after logout() definition
    const afterLogout = code.indexOf('}', logoutStart) + 1;
    code = code.slice(0, loginStart) + code.slice(afterLogout);
}

fs.writeFileSync('public/js/admin.js', code);
