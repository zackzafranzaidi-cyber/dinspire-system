const fs = require('fs');
let code = fs.readFileSync('routes/auth.js', 'utf8');

let target = 'const { error } = await supabase.from("customers").insert([';
let p = code.indexOf(target);
if (p > -1) {
    let before = code.substring(0, p);
    let after = code.substring(p);
    
    // Find the end of the insert block
    let endInsert = after.indexOf(']);');
    if (endInsert > -1) {
        endInsert += 3; // include ']);'
        
        let block1 = after.substring(0, endInsert);
        let block2 = after.substring(endInsert);
        
        let injection = `
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
           await supabase.from("customer_directory").upsert({
              phone_number: p,
              real_name: safeUsername
           }, { onConflict: 'phone_number', ignoreDuplicates: true }).catch(console.error);
        }
      }
`;
        
        code = before + block1 + injection + block2;
        fs.writeFileSync('routes/auth.js', code);
        console.log("FIXED routes/auth.js successfully");
    }
}
