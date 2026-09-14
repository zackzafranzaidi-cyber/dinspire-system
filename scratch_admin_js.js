const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');

code = code.replace(/function switchTab/g, 'function switchAdminTab');
code = code.replace(/switchTab\(/g, 'switchAdminTab(');

// Also remove init() call on DOMContentLoaded because Owner app will call it when needed, or we just let it run.
// Wait, admin.js has:
// document.addEventListener("DOMContentLoaded", () => { ... })
// We should remove the login logic from admin.js completely because we are in owner.js!
code = code.replace(/document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/g, `
// Modified for Owner Integration
function initAdminCMS() {
    if (typeof API_BASE_URL === 'undefined') window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api';
    fetchData();
}
`);

// Rename showGlobalLoader and hideGlobalLoader to avoid conflict, or just remove them if we use owner's loader.
// Let's comment them out so it uses owner's loader.
code = code.replace(/function showGlobalLoader\(\)\s*\{[\s\S]*?\}\s*function hideGlobalLoader\(\)\s*\{[\s\S]*?\}/, '');

// Also remove systemLogin function since it's in owner.js
code = code.replace(/async function systemLogin\(\)\s*\{[\s\S]*?btn\.innerText = "Log Masuk";\s*\}/, '');
code = code.replace(/function logout\(\)\s*\{[\s\S]*?\}\s*\}/, '');

fs.writeFileSync('public/js/admin.js', code);
