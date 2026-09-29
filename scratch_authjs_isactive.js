const fs = require('fs');
let content = fs.readFileSync('routes/auth.js', 'utf8');

const loginQuery = /const \{ data: staff, error: errStaff \} = await supabase\n\s*\.from\("staff"\)\n\s*\.select\("\*"\)\n\s*\.eq\("username", req\.body\.phone\)\n\s*\.single\(\);/;

const newLoginQuery = `const { data: staff, error: errStaff } = await supabase
      .from("staff")
      .select("*")
      .eq("username", req.body.phone)
      .neq("is_active", false)
      .single();`;

content = content.replace(loginQuery, newLoginQuery);
fs.writeFileSync('routes/auth.js', content);
console.log("Updated auth.js to block inactive staff login");
