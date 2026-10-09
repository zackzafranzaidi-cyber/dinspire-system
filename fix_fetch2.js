const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// I will replace `headers: { Authorization: `Bearer ${sysToken}` }` with `credentials: "include"`
const target = 'headers: { Authorization: `Bearer ${sysToken}` }';
if (code.includes(target)) {
    code = code.replace(target, 'credentials: "include"');
    fs.writeFileSync('public/staff/js/staff.js', code);
    console.log("Fixed fetch credentials");
} else {
    console.log("Not found");
}
