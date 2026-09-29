const fs = require('fs');
let content = fs.readFileSync('routes/admin.js', 'utf8');

const regexDelete = /if \(delErr\) throw delErr;\n            \} else \{\n              \/\/ Jika admin memang sengaja memadam KESEMUA baris pada jadual tersebut di UI\n              const \{ error: delAllErr \} = await supabase\n                \.from\(table\)\n                \.delete\(\)\n                \.neq\("id", "00000000-0000-0000-0000-000000000000"\); \/\/ ID dummy\/all safe check\n\n              if \(delAllErr\) throw delAllErr;\n            \}/;

const newDeleteLogic = `
            if (currentIds.length > 0) {
              if (table === 'staff') {
                 // Soft delete for staff
                 const { error: delErr } = await supabase
                  .from(table)
                  .update({ is_active: false })
                  .not("id", "in", "(" + currentIds.map(id => \`"\${id}"\`).join(",") + ")");
                 if (delErr) throw delErr;
              } else {
                 const { error: delErr } = await supabase
                  .from(table)
                  .delete()
                  .not("id", "in", "(" + currentIds.map(id => \`"\${id}"\`).join(",") + ")");
                 if (delErr) throw delErr;
              }
            } else {
              if (table === 'staff') {
                  const { error: delAllErr } = await supabase
                  .from(table)
                  .update({ is_active: false })
                  .neq("id", "00000000-0000-0000-0000-000000000000");
                  if (delAllErr) throw delAllErr;
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
console.log("Updated admin.js soft delete");
