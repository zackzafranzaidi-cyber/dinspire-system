const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

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

code = code.replace(/async function loginAdmin\(allowedRoles\)\s*\{[\s\S]*?btn\.innerText = "Log Masuk";\s*\}/g, '');
code = code.replace(/function logoutAdmin\(\)\s*\{[\s\S]*?location\.reload\(\);\s*\}\);\s*\}/g, '');
code = code.replace(/let globalLoaderStartTime = Date\.now\(\);\s*function showGlobalLoader\(\)\s*\{[\s\S]*?\}\s*function hideGlobalLoader\(\)\s*\{[\s\S]*?300\);\s*\}\s*\}/g, '');

code = code.replace(/logoutAdmin\(\)/g, 'if(typeof logoutOwner === "function") logoutOwner();');
code = code.replace(/fetchData\(\)/g, 'loadAdminData()');

fs.writeFileSync('public/js/owner_cms.js', code);
