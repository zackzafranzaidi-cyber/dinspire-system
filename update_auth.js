const fs = require('fs');
let code = fs.readFileSync('routes/auth.js', 'utf8');

const targetStr = `      const { error } = await supabase.from("customers").insert([
        {
          name: safeUsername,
          phone: safePhone,
          address: safeAddress,
          avatar_url: String(avatar_url || "").substring(0, 255), // [DIBAIKI] Hadkan avatar_url
          password_hash,
        },
      ]);if (error) {`;

const replacementStr = `      const { error } = await supabase.from("customers").insert([
        {
          name: safeUsername,
          phone: safePhone,
          address: safeAddress,
          avatar_url: String(avatar_url || "").substring(0, 255), // [DIBAIKI] Hadkan avatar_url
          password_hash,
        },
      ]);
      
      if (!error) {
        const formatPhone = (phone) => {
          let p = String(phone).replace(/\\D/g, "");
          if (p.startsWith("0")) p = "6" + p;
          else if (p.startsWith("+60")) p = p.substring(1);
          else if (!p.startsWith("60")) p = "60" + p;
          return p;
        };
        const p = formatPhone(safePhone);
        if (p.length > 5) {
           supabase.from("customer_directory").upsert({
              phone_number: p,
              real_name: safeUsername
           }, { onConflict: 'phone_number', ignoreDuplicates: true }).then().catch(console.error);
        }
      }
      
      if (error) {`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('routes/auth.js', code);
console.log("Updated auth.js for Customer Directory");
