const fs = require('fs');
let staff = fs.readFileSync('routes/staff.js', 'utf8');

const targetStr = /\.in\("setting_key", \["peratus_komisen", "gaji_asas", "komisen_part_time"\]\),/;
const newStr = `.in("setting_key", ["peratus_komisen", "gaji_asas", "komisen_part_time", "staff_status"]),`;

staff = staff.replace(targetStr, newStr);
fs.writeFileSync('routes/staff.js', staff);
console.log("Updated setting keys in staff.js!");
