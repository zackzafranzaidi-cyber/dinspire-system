const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

const regex = /window\.initAdminCMS = function\(\) \{[\s\S]*?loadAdminData\(\);\s*\};/;
const newCode = `window.initAdminCMS = function() {
    if (Object.keys(appData).length === 0) {
        loadAdminData();
    }
};`;

code = code.replace(regex, newCode);
fs.writeFileSync('public/js/owner_cms.js', code);
