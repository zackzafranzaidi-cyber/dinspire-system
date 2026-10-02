const fs = require('fs');
let code = fs.readFileSync('routes/bookings.js', 'utf8');

// Fix 1: The defaults for name and phone
let target1 = `      const {
        customer_name,
        no_phone,
        service_id,
        booking_date,
        booking_time,
        payment_method,
        receipt_url,
        price,
      } = req.body;
        const staff_id = req.user.id;`;

let repl1 = `      const {
        service_id,
        booking_date,
        booking_time,
        payment_method,
        receipt_url,
        price,
      } = req.body;
      
      let customer_name = (req.body.customer_name || "").trim();
      if (!customer_name) customer_name = "Pelanggan Walk-In";
      
      let no_phone = (req.body.no_phone || "").trim();
      if (!no_phone) no_phone = "TIADA-" + Date.now();
      
      const staff_id = req.user.id;`;

code = code.replace(target1, repl1);

// Fix 2: The insertion payload
let target2 = `        const { error } = await supabase.from("walkin_records").insert([
        {
          nama_pelanggan: customer_name,
          no_phone: no_phone || "-",`;

let repl2 = `
        const formatPhone = (phone) => {
          let p = String(phone).replace(/\\D/g, "");
          if (p.startsWith("0")) p = "6" + p;
          else if (p.startsWith("+60")) p = p.substring(1);
          else if (!p.startsWith("60")) p = "60" + p;
          return p;
        };

        if (no_phone && !no_phone.startsWith("TIADA-") && no_phone !== "-") {
           const p = formatPhone(no_phone);
           if (p.length > 5) {
              await supabase.from("customer_directory").upsert({
                 phone_number: p,
                 real_name: customer_name
              }, { onConflict: 'phone_number', ignoreDuplicates: true });
           }
        }

        const { error } = await supabase.from("walkin_records").insert([
        {
          nama_pelanggan: customer_name,
          no_phone: no_phone,`;

code = code.replace(target2, repl2);

fs.writeFileSync('routes/bookings.js', code);
console.log("Updated bookings.js manually");
