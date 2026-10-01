const fs = require('fs');
let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const target1 = /staffData\.bookings = Array\.isArray\(data\) \? data : data\.bookings \|\| \[\];/g;
const replace1 = 'staffData.bookings = Array.isArray(data) ? data : data.bookings || [];\n        staffData.status_pekerja = data.status_pekerja;';

staff = staff.replace(target1, replace1);

const target2 = /staffData\.isPunchedIn = data\.isPunchedIn \|\| false;/g;
const replace2 = 'staffData.isPunchedIn = data.isPunchedIn || false;\n           staffData.status_pekerja = data.status_pekerja;';

staff = staff.replace(target2, replace2);

fs.writeFileSync('public/staff/js/staff.js', staff);
console.log("Injected status_pekerja to staffData assignment");
