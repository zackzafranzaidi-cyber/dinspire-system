const fs = require('fs');

let admin = fs.readFileSync('routes/admin.js', 'utf8');

const targetStr = /supabase\.from\("staff"\)\.select\("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja"\)\.then\(res => \{\s*if \(res\.error && res\.error\.code === '42703'\) \{\s*return supabase\.from\("staff"\)\.select\("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, status_pekerja"\);\s*\}\s*return res;\s*\}\)/;

const newStr = `supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja").then(async res => {
            if (res.error && res.error.code === '42703') {
                // Try without is_active
                const res2 = await supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, status_pekerja");
                if (res2.error && res2.error.code === '42703') {
                    // Try without status_pekerja as well (baseline schema)
                    return supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password");
                }
                return res2;
            }
            return res;
          })`;

admin = admin.replace(targetStr, newStr);
fs.writeFileSync('routes/admin.js', admin);
console.log("Fixed Staff fallback query!");
