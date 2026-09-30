const fs = require('fs');
let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');
staff = staff.replace(/din_shop_data/g, 'din_shop_data_v2');
fs.writeFileSync('public/staff/js/staff.js', staff);

let owner = fs.readFileSync('public/owner/js/owner.js', 'utf8');
owner = owner.replace(/din_owner_dashboard/g, 'din_owner_dashboard_v2');
fs.writeFileSync('public/owner/js/owner.js', owner);
console.log("Phase 5 fixed via Cache Key Versioning!");
