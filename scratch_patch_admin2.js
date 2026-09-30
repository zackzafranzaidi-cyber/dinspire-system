const fs = require('fs');
let content = fs.readFileSync('routes/admin.js', 'utf8');

// I will just replace the whole Soft delete block
const regex = /if \(table === 'staff'\) \{[\s\S]*?\} else \{/g;
const replacement = `if (table === 'staff') {
                 let delErr;
                 const tryUpdate = await supabase
                  .from(table)
                  .update({ is_active: false })
                  .not("id", "in", "(" + currentIds.map(id => \`"\${id}"\`).join(",") + ")");
                  
                 if (tryUpdate.error && tryUpdate.error.code === '42703') {
                     const fallbackDel = await supabase
                      .from(table)
                      .delete()
                      .not("id", "in", "(" + currentIds.map(id => \`"\${id}"\`).join(",") + ")");
                     delErr = fallbackDel.error;
                 } else {
                     delErr = tryUpdate.error;
                 }
                 if (delErr) throw delErr;
              } else {`;
              
let matches = 0;
content = content.replace(/if \(table === 'staff'\) \{\n\s*\/\/\s*Soft delete for staff\n\s*let updateRes = await supabase\.from\(table\)\.update\(\{ is_active: false \}\);\n\s*if \(updateRes\.error && updateRes\.error\.code === '42703'\) \{\n\s*\/\/ Fallback to normal delete if is_active doesn't exist\n\s*updateRes = await supabase\.from\(table\)\.delete\(\);\n\s*\}\n\s*const \{ error: delErr \} = updateRes\n\s*\.not\("id", "in", "\(" \+ currentIds\.map\(id => \`"\$\{id\}"\`\)\.join\(","\) \+ "\)"\);\n\s*if \(delErr\) throw delErr;\n\s*\} else \{/g, replacement);

const replacementAll = `if (table === 'staff') {
                  let delAllErr;
                  const tryUpdateAll = await supabase
                  .from(table)
                  .update({ is_active: false })
                  .neq("id", "00000000-0000-0000-0000-000000000000");
                  
                  if (tryUpdateAll.error && tryUpdateAll.error.code === '42703') {
                      const fallbackAll = await supabase
                      .from(table)
                      .delete()
                      .neq("id", "00000000-0000-0000-0000-000000000000");
                      delAllErr = fallbackAll.error;
                  } else {
                      delAllErr = tryUpdateAll.error;
                  }
                  if (delAllErr) throw delAllErr;
              } else {`;
              
content = content.replace(/if \(table === 'staff'\) \{\n\s*let updateAllRes = await supabase\.from\(table\)\.update\(\{ is_active: false \}\);\n\s*if \(updateAllRes\.error && updateAllRes\.error\.code === '42703'\) \{\n\s*updateAllRes = await supabase\.from\(table\)\.delete\(\);\n\s*\}\n\s*const \{ error: delAllErr \} = updateAllRes\n\s*\.neq\("id", "00000000-0000-0000-0000-000000000000"\);\n\s*if \(delAllErr\) throw delAllErr;\n\s*\} else \{/g, replacementAll);

fs.writeFileSync('routes/admin.js', content);
console.log("Fixed admin.js soft delete gracefully");
