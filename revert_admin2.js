const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

admin = admin.replace(/status_pekerja: \(staffStatuses && staffStatuses\[s\.id\]\) \|\| "full_time"\s*\}\)\),/g, 'status_pekerja: s.status_pekerja || "full_time"\n            })),');

fs.writeFileSync('routes/admin.js', admin);
console.log("Fixed status_pekerja map in admin.js!");
