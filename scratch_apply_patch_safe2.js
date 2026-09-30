const fs = require('fs');
let auth = fs.readFileSync('routes/auth.js', 'utf8');

auth = auth.replace(
  'const { data: staff, error: errStaff } = await supabase\n      .from("staff")\n      .select("*")\n      .eq("username", req.body.username)\n      .neq("is_active", false)\n      .single();',
  `let resStaff = await supabase
      .from("staff")
      .select("*")
      .eq("username", req.body.username)
      .neq("is_active", false)
      .single();
    if (resStaff.error && resStaff.error.code === '42703') {
        resStaff = await supabase
          .from("staff")
          .select("*")
          .eq("username", req.body.username)
          .single();
    }
    const { data: staff, error: errStaff } = resStaff;`
);

let admin = fs.readFileSync('routes/admin.js', 'utf8');
admin = admin.replace(
  'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja"),',
  `supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, is_active, status_pekerja").then(res => {
          if (res.error && res.error.code === '42703') { 
              return supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, must_change_password, status_pekerja");
          }
          return res;
        }),`
);

fs.writeFileSync('routes/auth.js', auth);
fs.writeFileSync('routes/admin.js', admin);
