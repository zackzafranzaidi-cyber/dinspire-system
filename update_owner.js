const fs = require('fs');
let code = fs.readFileSync('routes/owner.js', 'utf8');

const targetStr = `          const formatPhone = (phone) => {
            let p = String(phone).replace(/\\D/g, "");
            if (p.startsWith("0")) p = "6" + p;
            else if (p.startsWith("+60")) p = p.substring(1);
            else if (!p.startsWith("60")) p = "60" + p;
            return p;
          };

          for (const c of customers) {
            if (!c.phone) continue;
            const p = formatPhone(c.phone);
            if (!uniqueCustomers.has(p)) {
              uniqueCustomers.set(p, {
                name: c.name,
                phone: p,
                source: "Customer Portal",
                created_at: c.created_at
              });
            }
          }

          for (const w of walkins) {
            if (!w.no_phone || w.no_phone === "-") continue;
            const p = formatPhone(w.no_phone);
            if (!uniqueCustomers.has(p)) {
              uniqueCustomers.set(p, {
                name: w.nama_pelanggan,
                phone: p,
                source: "Walk-In",
                created_at: w.created_at
              });
            }
          }`;

const replacementStr = `          const formatPhone = (phone) => {
            let p = String(phone).replace(/\\D/g, "");
            if (p.startsWith("0")) p = "6" + p;
            else if (p.startsWith("+60")) p = p.substring(1);
            else if (!p.startsWith("60")) p = "60" + p;
            return p;
          };

          for (const c of customers) {
            if (!c.phone || c.phone.startsWith("TIADA-") || c.phone === "-") continue;
            const p = formatPhone(c.phone);
            if (!uniqueCustomers.has(p)) {
              uniqueCustomers.set(p, {
                name: c.name,
                phone: p,
                source: "Customer Portal",
                created_at: c.created_at
              });
            }
          }

          for (const w of walkins) {
            if (!w.no_phone || w.no_phone.startsWith("TIADA-") || w.no_phone === "-") continue;
            const p = formatPhone(w.no_phone);
            if (!uniqueCustomers.has(p)) {
              uniqueCustomers.set(p, {
                name: w.nama_pelanggan,
                phone: p,
                source: "Walk-In",
                created_at: w.created_at
              });
            }
          }`;

if(code.includes('if (!w.no_phone || w.no_phone === "-") continue;')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('routes/owner.js', code);
    console.log("Fixed marketing-customers route to ignore TIADA- phones");
} else {
    console.log("Could not find string in owner.js");
}
