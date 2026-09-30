const fs = require('fs');
let content = fs.readFileSync('routes/admin.js', 'utf8');

// 1. Fetching staff gracefully
content = content.replace(
  'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password"),',
  `supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja").then(res => {
          if (res.error && res.error.code === '42703') { // column does not exist
              return supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, status_pekerja");
          }
          return res;
        }),`
);

// 2. Mapping staff gracefully
const syncDataRegex = /staff: \{\n\s*table: "staff",\n\s*mapFn: \(i\) => \(\{\n\s*id: i\.id,\n\s*username: i\.username,\n\s*jenis_staf: i\.jenis_staf,\n\s*branch_id: i\.branch_id,\n\s*status_pekerja: i\.status_pekerja \|\| "full_time"\n\s*\}\),/;

const newSyncData = `staff: {
          table: "staff",
          mapFn: (i) => {
            const mapped = {
                id: i.id,
                username: i.username,
                jenis_staf: i.jenis_staf,
                branch_id: i.branch_id,
                status_pekerja: i.status_pekerja || "full_time"
            };
            if (i.is_active !== undefined) mapped.is_active = i.is_active;
            return mapped;
          },`;
          
content = content.replace(/staff: \{\s*table: "staff",\s*mapFn: \(i\) => \(\{\s*id: i\.id,\s*username: i\.username,\s*jenis_staf: i\.jenis_staf,\s*branch_id: i\.branch_id,\s*status_pekerja: i\.status_pekerja \|\| "full_time"\s*\}\),/, newSyncData);

// 3. Deleting staff gracefully
const regexDelete = /if \(delErr\) throw delErr;\n            \} else \{\n              \/\/ Jika admin memang sengaja memadam KESEMUA baris pada jadual tersebut di UI\n              const \{ error: delAllErr \} = await supabase\n                \.from\(table\)\n                \.delete\(\)\n                \.neq\("id", "00000000-0000-0000-0000-000000000000"\); \/\/ ID dummy\/all safe check\n\n              if \(delAllErr\) throw delAllErr;\n            \}/;

const newDeleteLogic = `
            if (currentIds.length > 0) {
              if (table === 'staff') {
                 let tryUpdate = await supabase
                  .from(table)
                  .update({ is_active: false })
                  .not("id", "in", "(" + currentIds.map(id => \`"\${id}"\`).join(",") + ")");
                 if (tryUpdate.error && tryUpdate.error.code === '42703') {
                     tryUpdate = await supabase
                      .from(table)
                      .delete()
                      .not("id", "in", "(" + currentIds.map(id => \`"\${id}"\`).join(",") + ")");
                 }
                 if (tryUpdate.error) throw tryUpdate.error;
              } else {
                 const { error: delErr } = await supabase
                  .from(table)
                  .delete()
                  .not("id", "in", "(" + currentIds.map(id => \`"\${id}"\`).join(",") + ")");
                 if (delErr) throw delErr;
              }
            } else {
              if (table === 'staff') {
                  let tryUpdateAll = await supabase
                  .from(table)
                  .update({ is_active: false })
                  .neq("id", "00000000-0000-0000-0000-000000000000");
                  if (tryUpdateAll.error && tryUpdateAll.error.code === '42703') {
                      tryUpdateAll = await supabase
                      .from(table)
                      .delete()
                      .neq("id", "00000000-0000-0000-0000-000000000000");
                  }
                  if (tryUpdateAll.error) throw tryUpdateAll.error;
              } else {
                  const { error: delAllErr } = await supabase
                  .from(table)
                  .delete()
                  .neq("id", "00000000-0000-0000-0000-000000000000");
                  if (delAllErr) throw delAllErr;
              }
            }
`;

content = content.replace(/if \(currentIds\.length > 0\) \{[\s\S]*?if \(delAllErr\) throw delAllErr;\n            \}/, newDeleteLogic.trim());

fs.writeFileSync('routes/admin.js', content);
console.log("Updated admin.js gracefully");
