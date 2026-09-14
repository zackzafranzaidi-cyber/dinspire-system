const fs = require('fs');
let code = fs.readFileSync('public/js/admin_backup.js', 'utf8');

// Replacements
code = code.replace(/function switchTab/g, 'function switchAdminTab');
code = code.replace(/switchTab\(/g, 'switchAdminTab(');

code = code.replace(/document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/g, `
function initAdminCMS() {
    loadAdminData();
}
`);

const toRemove1 = `const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:3000/api"
  : "https://api.dinspirebarbershop.com/api";`;
code = code.replace(toRemove1, '');

const toRemove2 = `// [DIBAIKI] Fungsi keselamatan XSS
function escapeHTML(str) {
  if (!str) return "";
  const charsToReplace = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  };
  return String(str).replace(/[&<>'"]/g, (tag) => charsToReplace[tag] || tag);
}`;
code = code.replace(toRemove2, '');

let lines = code.split('\n');
let newLines = [];

let inLogin = false;
let inLogout = false;
let inLoader = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('async function loginAdmin(allowedRoles)')) inLogin = true;
    if (lines[i].includes('function logoutAdmin()')) inLogout = true;
    if (lines[i].includes('let globalLoaderStartTime = Date.now();')) inLoader = true;
    
    if (!inLogin && !inLogout && !inLoader) {
        newLines.push(lines[i]);
    }
    
    if (inLogin && lines[i].includes('btn.innerText = "Log Masuk";')) {
        inLogin = false;
        i++; // skip }
    }
    
    if (inLogout && lines[i].includes('location.reload();')) {
        inLogout = false;
        i += 2; // skip }); and }
    }
    
    if (inLoader && lines[i].includes('preloader.style.visibility = \'hidden\';')) {
        inLoader = false;
        i += 2; // skip }, remaining); and }
    }
}

code = newLines.join('\n');
code = code.replace(/logoutAdmin\(\)/g, 'if(typeof logoutOwner === "function") logoutOwner();');
code = code.replace(/fetchData\(\)/g, 'loadAdminData()');

fs.writeFileSync('public/js/owner_cms.js', code);
