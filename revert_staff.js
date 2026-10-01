const fs = require('fs');
let staff = fs.readFileSync('routes/staff.js', 'utf8');

staff = staff.replace(/\.in\("setting_key", \["peratus_komisen", "gaji_asas", "komisen_part_time", "staff_status"\]\),/, '.in("setting_key", ["peratus_komisen", "gaji_asas", "komisen_part_time"]),');

const logicTarget = /let isPartTime = false;\s*\(settingData \|\| \[\]\)\.forEach\(s => \{\s*if \(s\.setting_key === 'staff_status'\) \{\s*try \{\s*const statuses = JSON\.parse\(s\.setting_value\);\s*if \(statuses\[staff_id\] === 'part_time'\) isPartTime = true;\s*\} catch\(e\) \{\}\s*\}\s*\}\);/;

staff = staff.replace(logicTarget, `const isPartTime = staffInfo && staffInfo.status_pekerja === 'part_time';`);

fs.writeFileSync('routes/staff.js', staff);
console.log("Restored routes/staff.js");
