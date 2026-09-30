const fs = require('fs');
let content = fs.readFileSync('routes/admin.js', 'utf8');

// Fallback for stData
const regex = /supabase\.from\("staff"\)\.select\("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja"\),/;
const replacement = `supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja").then(res => {
          if (res.error && res.error.code === '42703') { // column does not exist
              return supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, status_pekerja");
          }
          return res;
        }),`;
content = content.replace(regex, replacement);

// Fallback for update
const regexUpdate = /const \{ error: delErr \} = await supabase\n\s*\.from\(table\)\n\s*\.update\(\{ is_active: false \}\)/;
const replacementUpdate = `let updateRes = await supabase.from(table).update({ is_active: false });
                 if (updateRes.error && updateRes.error.code === '42703') {
                     // Fallback to normal delete if is_active doesn't exist
                     updateRes = await supabase.from(table).delete();
                 }
                 const { error: delErr } = updateRes`;
content = content.replace(regexUpdate, replacementUpdate);

const regexUpdateAll = /const \{ error: delAllErr \} = await supabase\n\s*\.from\(table\)\n\s*\.update\(\{ is_active: false \}\)/;
const replacementUpdateAll = `let updateAllRes = await supabase.from(table).update({ is_active: false });
                  if (updateAllRes.error && updateAllRes.error.code === '42703') {
                      updateAllRes = await supabase.from(table).delete();
                  }
                  const { error: delAllErr } = updateAllRes`;
content = content.replace(regexUpdateAll, replacementUpdateAll);

fs.writeFileSync('routes/admin.js', content);
console.log("Patched admin.js for graceful degradation");
