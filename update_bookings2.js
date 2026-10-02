const fs = require('fs');
let code = fs.readFileSync('routes/bookings.js', 'utf8');

const targetStr = `        const { error } = await supabase.from("walkin_records").insert([
          {
            nama_pelanggan: customer_name,
            no_phone: no_phone,`;

const replacementStr = `
        const formatPhone = (phone) => {
          let p = String(phone).replace(/\\D/g, "");
          if (p.startsWith("0")) p = "6" + p;
          else if (p.startsWith("+60")) p = p.substring(1);
          else if (!p.startsWith("60")) p = "60" + p;
          return p;
        };

        // Simpan ke Buku Telefon Berpusat (Master Directory) secara senyap
        if (no_phone && !no_phone.startsWith("TIADA-") && no_phone !== "-") {
           const p = formatPhone(no_phone);
           if (p.length > 5) {
              supabase.from("customer_directory").upsert({
                 phone_number: p,
                 real_name: customer_name
              }, { onConflict: 'phone_number', ignoreDuplicates: true }).then().catch(console.error);
           }
        }

        const { error } = await supabase.from("walkin_records").insert([
          {
            nama_pelanggan: customer_name,
            no_phone: no_phone,`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('routes/bookings.js', code);
console.log("Updated bookings.js for Walk-In");
