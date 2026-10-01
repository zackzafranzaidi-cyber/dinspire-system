const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

// Update /admin/data response mapping
const targetMapStr = /Staff: \(stData \|\| \[\]\)\.map\(\(s\) => \(\{([\s\S]*?)\}\)\),/;

const newMapStr = `Staff: (stData || []).map((s) => ({$1, status_pekerja: (settings.find(x => x.setting_key === "staff_status") && JSON.parse(settings.find(x => x.setting_key === "staff_status").setting_value)[s.id]) || "full_time"})),`;

if (!admin.includes('status_pekerja: (settings.find')) {
    admin = admin.replace(targetMapStr, newMapStr);
    fs.writeFileSync('routes/admin.js', admin);
    console.log("Injected staff_status mapping!");
} else {
    console.log("Already injected mapping.");
}
