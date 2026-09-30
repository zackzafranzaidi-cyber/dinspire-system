const fs = require('fs');

// 1. ADMIN
let admin = fs.readFileSync('routes/admin.js', 'utf8');
admin = admin.replace(
  'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password"),',
  `supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja").then(res => {
          if (res.error && res.error.code === '42703') { 
              return supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, status_pekerja");
          }
          return res;
        }),`
);
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
admin = admin.replace(/staff: \{\s*table: "staff",\s*mapFn: \(i\) => \(\{\s*id: i\.id,\s*username: i\.username,\s*jenis_staf: i\.jenis_staf,\s*branch_id: i\.branch_id,\s*status_pekerja: i\.status_pekerja \|\| "full_time"\s*\}\),/, newSyncData);
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
admin = admin.replace(/if \(currentIds\.length > 0\) \{[\s\S]*?if \(delAllErr\) throw delAllErr;\n            \}/, newDeleteLogic.trim());
fs.writeFileSync('routes/admin.js', admin);


// 2. SHOP
let shop = fs.readFileSync('routes/shop.js', 'utf8');
shop = shop.replace('supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment").neq("is_active", false).limit(100),', 
`supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, is_active").limit(100).then(res => {
          if (res.error && res.error.code === "42703") {
              return supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment").limit(100);
          }
          if (res.data) res.data = res.data.filter(s => s.is_active !== false);
          return res;
        }),`);
fs.writeFileSync('routes/shop.js', shop);


// 3. AUTH
let auth = fs.readFileSync('routes/auth.js', 'utf8');
const oldAuth = `const { data: staff, error: errStaff } = await supabase
      .from("staff")
      .select("*")
      .eq("username", req.body.phone)
      .neq("is_active", false)
      .single();`;
const newAuth = `let resStaff = await supabase
      .from("staff")
      .select("*")
      .eq("username", req.body.phone)
      .neq("is_active", false)
      .single();
    if (resStaff.error && resStaff.error.code === '42703') {
        resStaff = await supabase
          .from("staff")
          .select("*")
          .eq("username", req.body.phone)
          .single();
    }
    const { data: staff, error: errStaff } = resStaff;`;
auth = auth.replace(oldAuth, newAuth);
fs.writeFileSync('routes/auth.js', auth);

console.log("Patched safely");
