const fs = require('fs');
let code = fs.readFileSync('routes/owner.js', 'utf8');

const targetStr = `          walkins.forEach(w => {
             if (w.no_phone) {
                const p = formatPhone(w.no_phone);
                if (p.length > 5) {
                    allRecords.push({ phone: p, name: w.nama_pelanggan || "Walk-In", source: "Walk-In", created_at: w.created_at || "1970-01-01" });
                }
             }
          });`;

const replacementStr = `          walkins.forEach(w => {
             if (w.no_phone && !w.no_phone.startsWith("TIADA-") && w.no_phone !== "-") {
                const p = formatPhone(w.no_phone);
                if (p.length > 5) {
                    allRecords.push({ phone: p, name: w.nama_pelanggan || "Walk-In", source: "Walk-In", created_at: w.created_at || "1970-01-01" });
                }
             }
          });`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('routes/owner.js', code);
console.log("Updated marketing-customers loop for walkins");
