const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

const oldRevQuery = 'supabase.from("reviews").select("bintang, review_text, created_at").order("created_at", { ascending: false }).limit(20)';
const newRevQuery = 'supabase.from("reviews").select("bintang, review_text, created_at, no_booking").order("created_at", { ascending: false }).limit(20)';
shop = shop.replace(oldRevQuery, newRevQuery);

const oldBookLogic = `      if (bookingIds.length > 0) {
        // 3. HANYA tarik rekod tempahan yang berkaitan dengan ulasan (Bukan tarik semua)
        const { data: bData } = await supabase
          .from("booking_records")
          .select("no_booking, nama_pelanggan, no_phone, haircuts(nama_potongan), staff(branches(nama_cawangan))")
          .in("no_booking", bookingIds);
        bookData = bData || [];`;

const newBookLogic = `      if (bookingIds.length > 0) {
        // 3. HANYA tarik rekod tempahan yang berkaitan dengan ulasan (Bukan tarik semua)
        const { data: bData } = await supabase
          .from("booking_records")
          .select("no_booking, nama_pelanggan, no_phone, haircuts(nama_potongan), staff(branches(nama_cawangan))")
          .in("no_booking", bookingIds);
          
        const { data: tData } = await supabase
          .from("treatment_records")
          .select("no_booking, nama_pelanggan, no_phone, treatments(nama_rawatan), staff(branches(nama_cawangan))")
          .in("no_booking", bookingIds);
          
        bookData = [...(bData || []), ...(tData || [])];`;

shop = shop.replace(oldBookLogic, newBookLogic);

const oldFormatLogic = `service: b && b.haircuts ? b.haircuts.nama_potongan : "Servis Dinspire",`;
const newFormatLogic = `service: b && b.haircuts ? b.haircuts.nama_potongan : (b && b.treatments ? b.treatments.nama_rawatan : "Servis Dinspire"),`;
shop = shop.replace(oldFormatLogic, newFormatLogic);

fs.writeFileSync('routes/shop.js', shop);
console.log("Fixed reviews in shop.js");
