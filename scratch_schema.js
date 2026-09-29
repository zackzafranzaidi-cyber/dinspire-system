const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

content = content.replace('Staff: ["id", "name", "jenis_staf", "branch_id", "kemahiran"],', 'Staff: ["id", "name", "jenis_staf", "status_pekerja", "branch_id", "kemahiran"],');

fs.writeFileSync('public/owner/js/owner_cms.js', content);
console.log("Replaced Staff schema");
