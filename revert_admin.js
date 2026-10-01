const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

// Remove staffStatuses parsing
admin = admin.replace(/let staffStatuses = \{\};\s*\(setAll \|\| \[\]\)\.forEach\(\(s\) => \{([\s\S]*?)try \{ staffStatuses = JSON\.parse\(s\.setting_value\); \} catch\(e\) \{\}\s*\}\s*\}\);/g, `(setAll || []).forEach((s) => {
          if (s.setting_key === "posters") {
            try {
              posters = JSON.parse(s.setting_value);
            } catch (e) {}
          } else if (s.setting_key === "shipping_fee") {
            settings.shipping_fee = parseFloat(s.setting_value) || 0;
          } else if (s.setting_key === "service_fee") {
            settings.service_fee = parseFloat(s.setting_value) || 0;
          } else if (s.setting_key === "peratus_komisen") {
            settings.peratus_komisen = parseFloat(s.setting_value) || 50;
          } else if (s.setting_key === "gaji_asas") {
            settings.gaji_asas = parseFloat(s.setting_value) || 1800;
          }
        });`);

// Restore Staff map
admin = admin.replace(/Staff: \(stData \|\| \[\]\)\.map\(\(s\) => \(\{\s*id: s\.id,\s*name: s\.username,\s*jenis_staf: s\.jenis_staf,\s*branch_id: s\.branch_id,\s*can_haircut: s\.can_haircut !== false,\s*can_treatment: s\.can_treatment !== false,\s*status_pekerja: \(staffStatuses && staffStatuses\[s\.id\]\) \|\| "full_time"\}\)\),/g, 
`Staff: (stData || []).map((s) => ({
              id: s.id,
              name: s.username,
              jenis_staf: s.jenis_staf,
              branch_id: s.branch_id,
              can_haircut: s.can_haircut !== false, // Fallback true if null/undefined
              can_treatment: s.can_treatment !== false,
              status_pekerja: s.status_pekerja || "full_time"
            })),`);

// Restore Staff syncData
admin = admin.replace(/await syncData\(\s*"staff",\s*data\.Staff \|\| \[\],\s*\(\s*i\s*\) => \(\{\s*id: i\.id,\s*username: i\.name,\s*jenis_staf: i\.jenis_staf \|\| "In-Branch",\s*branch_id: i\.branch_id \|\| null,\s*can_haircut: i\.can_haircut !== false,\s*can_treatment: i\.can_treatment !== false,\s*\}\),\s*\);\s*const staffStatuses = \{\};\s*\(data\.Staff \|\| \[\]\)\.forEach\(s => \{\s*if \(s\.id && s\.id\.length > 5\) staffStatuses\[s\.id\] = s\.status_pekerja \|\| "full_time";\s*\}\);\s*await supabase\.from\("settings"\)\.upsert\(\[\{ setting_key: "staff_status", setting_value: JSON\.stringify\(staffStatuses\) \}\], \{ onConflict: "setting_key" \}\);/g, 
`await syncData(
          "staff",
          data.Staff || [],
          (i) => ({
              id: i.id,
              username: i.name,
              jenis_staf: i.jenis_staf || "In-Branch",
              status_pekerja: i.status_pekerja || "full_time",
              branch_id: i.branch_id || null,
              can_haircut: i.can_haircut !== false,
              can_treatment: i.can_treatment !== false,
            }),
        );`);

fs.writeFileSync('routes/admin.js', admin);
console.log("Restored routes/admin.js");
