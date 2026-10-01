const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

const badCode = `, status_pekerja: (settings.find(x => x.setting_key === "staff_status") && JSON.parse(settings.find(x => x.setting_key === "staff_status").setting_value)[s.id]) || "full_time"`;
admin = admin.replace(badCode, `, status_pekerja: (staffStatuses && staffStatuses[s.id]) || "full_time"`);

fs.writeFileSync('routes/admin.js', admin);
console.log("Fixed the settings.find crash!");
