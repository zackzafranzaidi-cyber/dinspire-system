const fs = require('fs');

// shop.js
let shopContent = fs.readFileSync('routes/shop.js', 'utf8');
shopContent = shopContent.replace('supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment").neq("is_active", false)', 'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment").neq("is_active", false).then(res => { if (res.error && res.error.code === "42703") return supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment"); return res; })');
fs.writeFileSync('routes/shop.js', shopContent);

// auth.js
let authContent = fs.readFileSync('routes/auth.js', 'utf8');
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
authContent = authContent.replace(oldAuth, newAuth);
fs.writeFileSync('routes/auth.js', authContent);

console.log("Updated shop and auth gracefully");
