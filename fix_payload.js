const fs = require('fs');
let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');

staff = staff.replace(/reason = reason \+ " \\\| TUKAR SERVIS: " \+ newServiceName;/, 
`reason = reason + " | TUKAR_SERVIS: " + newServiceName + " | ID: " + srvSel.value;`);

fs.writeFileSync('public/staff/js/staff.js', staff);
console.log("Updated staff.js payload reason string");
