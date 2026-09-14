const fs = require('fs');
let code = fs.readFileSync('public/js/admin_backup.js', 'utf8');

// 1. Rename switchTab
code = code.replace(/function switchTab/g, 'function switchAdminTab');
code = code.replace(/switchTab\(/g, 'switchAdminTab(');

// 2. Replace DOMContentLoaded
const domLoadOld = `document.addEventListener("DOMContentLoaded", () => {
  let isLogged = localStorage.getItem("din_admin_logged");
  if (isLogged) {
    document.getElementById("login-overlay").style.display = "none";
    loadAdminData();
  } else {
    hideGlobalLoader();
  }
});`;

const domLoadNew = `function initAdminCMS() {
    loadAdminData();
}`;
code = code.replace(domLoadOld, domLoadNew);

// 3. Remove loginAdmin
const loginAdminRegex = /async function loginAdmin\(allowedRoles\) \{[\s\S]*?btn\.innerText = "Log Masuk CMS";\s*\}/;
code = code.replace(loginAdminRegex, '');

// 4. Remove logoutAdmin
const logoutAdminRegex = /function logoutAdmin\(\) \{[\s\S]*?location\.reload\(\);\s*\}\);\s*\}/;
code = code.replace(logoutAdminRegex, '');

// 5. Remove loaders
const loadersRegex = /let globalLoaderStartTime = Date\.now\(\);\s*function showGlobalLoader\(\) \{[\s\S]*?\}\s*function hideGlobalLoader\(\) \{[\s\S]*?300\);\s*\}\s*\}/;
// Wait, my regex before failed because of 300); vs 500);! Let's just use 500!
const loadersRegexFixed = /let globalLoaderStartTime = Date\.now\(\);\s*function showGlobalLoader\(\) \{[\s\S]*?\}\s*function hideGlobalLoader\(\) \{[\s\S]*?500\);\s*\}, remaining\);\s*\}\s*\}/;
code = code.replace(loadersRegexFixed, '');

// 6. Replace constants
const consts = `const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:3000/api"
  : "https://api.dinspirebarbershop.com/api";`;
code = code.replace(consts, '');

// 7. Remove escapeHTML
const escape = `// [DIBAIKI] Fungsi keselamatan XSS
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
code = code.replace(escape, '');

// 8. Handle logout and fetch
code = code.replace(/logoutAdmin\(\)/g, 'if(typeof logoutOwner === "function") logoutOwner();');
code = code.replace(/fetchData\(\)/g, 'loadAdminData()');

fs.writeFileSync('public/js/owner_cms.js', code);
