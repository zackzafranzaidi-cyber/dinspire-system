const fs = require('fs');
let code = fs.readFileSync('routes/bookings.js', 'utf8');

const targetStr = `      const {
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

const replacementStr = `      const {
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

code = code.replace(targetStr, replacementStr);

const targetInsertStr = `            nama_pelanggan: customer_name,
            no_phone: no_phone || "-",`;

const replacementInsertStr = `            nama_pelanggan: customer_name,
            no_phone: no_phone,`;

code = code.replace(targetInsertStr, replacementInsertStr);

fs.writeFileSync('routes/bookings.js', code);
console.log("Updated bookings.js for Walk-In");
