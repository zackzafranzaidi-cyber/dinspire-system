const fs = require('fs');
let code = fs.readFileSync('routes/staff.js', 'utf8');

const targetStr = `  try {
     const { data, error } = await supabase.from("customer_directory").select("real_name").eq("phone_number", formatted).maybeSingle();
     if (data && data.real_name) {
        res.json({ found: true, name: data.real_name });
     } else {
        res.json({ found: false });
     }
  } catch(e) {
     res.json({ found: false });
  }`;

const replStr = `  try {
     const { data, error } = await supabase.from("customer_directory").select("real_name").eq("phone_number", formatted).maybeSingle();
     if (data && data.real_name) {
        return res.json({ found: true, name: data.real_name });
     }
  } catch(e) {
     // Ignore and fallback
  }
  
  // FALLBACK if customer_directory fails or is empty
  try {
      const { data: cData } = await supabase.from("customers").select("name").eq("phone", phone).maybeSingle();
      if (cData && cData.name) {
          return res.json({ found: true, name: cData.name });
      }
      
      const { data: wData } = await supabase.from("walkin_records").select("nama_pelanggan").eq("no_phone", phone).order('created_at', {ascending: false}).limit(1).maybeSingle();
      if (wData && wData.nama_pelanggan) {
          return res.json({ found: true, name: wData.nama_pelanggan });
      }
      
      res.json({ found: false });
  } catch(e) {
      res.json({ found: false });
  }`;

code = code.replace(targetStr, replStr);
fs.writeFileSync('routes/staff.js', code);
console.log("Updated staff lookup fallback");
