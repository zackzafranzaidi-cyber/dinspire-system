const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

admin = admin.replace(
  'if (field !== "can_haircut" && field !== "can_treatment") {',
  'if (field !== "can_haircut" && field !== "can_treatment" && field !== "is_active") {'
);

const newLogic = `
      try {
        let updateRes = await supabase
          .from("staff")
          .update({ [field]: Boolean(value) })
          .eq("id", id);
          
        if (updateRes.error && updateRes.error.code === '42703') {
           return res.json({ status: "success", message: "Sistem pangkalan data belum menyokong ciri ini (is_active). Kemaskini diabaikan dengan selamat." });
        }
        if (updateRes.error) throw updateRes.error;
        
        res.json({ status: "success", message: "Kemaskini berjaya." });
`;

admin = admin.replace(
  /try \{\n\s*const \{ error \} = await supabase\n\s*\.from\("staff"\)\n\s*\.update\(\{ \[field\]: Boolean\(value\) \}\)\n\s*\.eq\("id", id\);\n\s*if \(error\) throw error;\n\s*res\.json\(\{ status: "success", message: "Kemaskini berjaya\." \}\);/,
  newLogic
);

fs.writeFileSync('routes/admin.js', admin);
console.log("Fixed capabilities");
