const fs = require('fs');
let staffjs = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// Replace tableStr with b.table_name
const regex = /let tableStr = String\(b\.order_no\)\.startsWith.*?;/g;
staffjs = staffjs.replace(regex, 'let tableStr = b.table_name || "booking_records";');

fs.writeFileSync('public/staff/js/staff.js', staffjs);
console.log("Updated tableStr to use b.table_name");
