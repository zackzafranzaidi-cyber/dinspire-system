const fs = require('fs');

// Add clear cache line to owner.js
let owner = fs.readFileSync('public/owner/js/owner.js', 'utf8');
owner = owner.replace('// Cache versioning untuk elak data tersangkut', `localStorage.removeItem("din_owner_dashboard");\n// Cache versioning untuk elak data tersangkut`);
fs.writeFileSync('public/owner/js/owner.js', owner);

// Add clear cache line to staff.js
let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');
staff = staff.replace('async function loadDashboardData(silent = false) {', `localStorage.removeItem("din_shop_data");\nasync function loadDashboardData(silent = false) {`);
fs.writeFileSync('public/staff/js/staff.js', staff);

console.log("Phase 5 Done");
