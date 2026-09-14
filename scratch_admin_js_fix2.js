const fs = require('fs');
let code = fs.readFileSync('public/js/admin.js', 'utf8');

code = code.replace(/fetchData\(\);/g, 'loadAdminData();');

const loginStart = code.indexOf('async function loginAdmin');
const logoutAdminStart = code.indexOf('function logoutAdmin()');
if (loginStart !== -1 && logoutAdminStart !== -1) {
    const afterLogout = code.indexOf('}', logoutAdminStart) + 1;
    code = code.slice(0, loginStart) + code.slice(afterLogout);
}

// Ensure initAdminCMS doesn't conflict
fs.writeFileSync('public/js/admin.js', code);
