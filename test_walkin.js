const express = require('express');
const app = express();
app.use(express.json());

// Mock authenticate middleware
const mockAuthenticate = (req, res, next) => {
    req.user = { id: 1, role: 'owner', username: 'Owner' }; // Use a valid staff/owner ID if needed
    next();
};
const mockRequireRole = () => (req, res, next) => next();

const supabase = require('./config/db');
// Replace require modules with mocks if needed
const bookingsRouter = require('./routes/bookings');

app.use('/api/bookings', (req, res, next) => {
    // Override the authenticate middleware somehow? No, it's already bound in the router.
    // Instead, let's just write a script that directly executes the logic from the route.
    next();
});

// Since we can't easily mock middleware inside the required router, let's just copy the logic.
async function testWalkin() {
    const crypto = require('crypto');
    try {
        let finalCustomerName = "Test";
        let finalNoPhone = "0123456789";
        let service_id = 1; // Assuming 1 exists
        let booking_date = "2026-10-03";
        let booking_time = "10:00";
        let staff_id = 1; 
        
        let hargaSebenar = 10; 
        const parsedPrice = hargaSebenar;
        const receiptName = "WLK" + crypto.randomUUID().split("-")[0].toUpperCase();
        let finalReceiptUrl = null;

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
              console.log("Upserting to customer_directory...");
              await supabase.from("customer_directory").upsert({
                 phone_number: p,
                 real_name: finalCustomerName
              }, { onConflict: 'phone_number', ignoreDuplicates: true }).catch(console.error);
           }
        }

        console.log("Inserting walkin...");
        const { error } = await supabase.from("walkin_records").insert([
          {
            nama_pelanggan: finalCustomerName,
            no_phone: finalNoPhone,
            tarikh: booking_date,
            masa: booking_time,
            jenis_potongan: service_id,
            staff_id: staff_id,
            harga_rm: parsedPrice,
            service_fee: 0,
            jenis_bayaran: "Tunai (Cash)",
            resit: finalReceiptUrl,
          },
        ]);
        if (error) throw error;
        console.log("Success!");
    } catch(e) {
        console.log("ERROR:", e);
    }
}
testWalkin();
