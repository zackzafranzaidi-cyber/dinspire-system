const fs = require('fs');
let code = fs.readFileSync('routes/bookings.js', 'utf8');

let p = code.indexOf('const parsedPrice = hargaSebenar;');
if (p > -1) {
    let before = code.substring(0, p);
    let after = code.substring(p);
    
    // We will inject the name/phone defaults here instead of replacing req.body
    let injection = `
        let finalCustomerName = (customer_name || "").trim();
        if (!finalCustomerName) finalCustomerName = "Pelanggan Walk-In";
        
        let finalNoPhone = (no_phone || "").trim();
        if (!finalNoPhone) finalNoPhone = "TIADA-" + Date.now();
        
`;
    code = before + injection + after;
    
    // Now replace the usages of customer_name and no_phone in the DB queries
    code = code.replace(/nama_pelanggan: customer_name,/g, 'nama_pelanggan: finalCustomerName,');
    code = code.replace(/.eq\("nama_pelanggan", customer_name\)/g, '.eq("nama_pelanggan", finalCustomerName)');
    code = code.replace(/.eq\("no_phone", no_phone \|\| "-"\)/g, '.eq("no_phone", finalNoPhone)');
    code = code.replace(/no_phone: no_phone \|\| "-",/g, 'no_phone: finalNoPhone,');
    
    // Inject the customer_directory logic right before inserting walkin_records
    let insertStr = 'const { error } = await supabase.from("walkin_records").insert([';
    let insertInjection = `
        const formatPhone = (phone) => {
          let p = String(phone).replace(/\\D/g, "");
          if (p.startsWith("0")) p = "6" + p;
          else if (p.startsWith("+60")) p = p.substring(1);
          else if (!p.startsWith("60")) p = "60" + p;
          return p;
        };

        if (finalNoPhone && !finalNoPhone.startsWith("TIADA-") && finalNoPhone !== "-") {
           const p = formatPhone(finalNoPhone);
           if (p.length > 5) {
              await supabase.from("customer_directory").upsert({
                 phone_number: p,
                 real_name: finalCustomerName
              }, { onConflict: 'phone_number', ignoreDuplicates: true }).catch(console.error);
           }
        }
        
        `;
    
    code = code.replace(insertStr, insertInjection + insertStr);
    
    fs.writeFileSync('routes/bookings.js', code);
    console.log("SUCCESSFULLY UPDATED BOOKINGS.JS");
} else {
    console.log("NOT FOUND");
}
