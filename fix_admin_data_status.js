const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

const parseStaffStatusTarget = /let settings = \{ shipping_fee: 0, service_fee: 0, peratus_komisen: 50, gaji_asas: 1800 \};/;
const parseStaffStatusNew = `let settings = { shipping_fee: 0, service_fee: 0, peratus_komisen: 50, gaji_asas: 1800 };
      let staffStatuses = {};`;

admin = admin.replace(parseStaffStatusTarget, parseStaffStatusNew);

const parseStaffStatusLoopTarget = /\} else if \(s\.setting_key === "gaji_asas"\) \{\s*settings\.gaji_asas = parseFloat\(s\.setting_value\) \|\| 1800;\s*\}/;
const parseStaffStatusLoopNew = `} else if (s.setting_key === "gaji_asas") {
          settings.gaji_asas = parseFloat(s.setting_value) || 1800;
        } else if (s.setting_key === "staff_status") {
          try { staffStatuses = JSON.parse(s.setting_value); } catch(e) {}
        }`;

admin = admin.replace(parseStaffStatusLoopTarget, parseStaffStatusLoopNew);

const mapTarget = /Staff: \(stData \|\| \[\]\)\.map\(\(s\) => \(\{\s*id: s\.id,\s*name: s\.username,\s*jenis_staf: s\.jenis_staf,\s*branch_id: s\.branch_id,\s*can_haircut: s\.can_haircut !== false, \/\/ Fallback true if null\/undefined\s*can_treatment: s\.can_treatment !== false,\s*\}\)\),/;

const mapNew = `Staff: (stData || []).map((s) => ({
            id: s.id,
            name: s.username,
            jenis_staf: s.jenis_staf,
            branch_id: s.branch_id,
            can_haircut: s.can_haircut !== false,
            can_treatment: s.can_treatment !== false,
            status_pekerja: staffStatuses[s.id] || "full_time"
          })),`;

admin = admin.replace(mapTarget, mapNew);

fs.writeFileSync('routes/admin.js', admin);
console.log("Updated admin.js to fetch staff_status!");
