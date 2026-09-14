const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

const regex = /document\.addEventListener\("DOMContentLoaded"[\s\S]*?\}\);\s*/;
const newCode = `
// Expose initAdminCMS globally
window.initAdminCMS = function() {
    loadAdminData();
};
`;

code = code.replace(regex, newCode);
fs.writeFileSync('public/js/owner_cms.js', code);
