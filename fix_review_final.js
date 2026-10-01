const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

const regexBook = /let bookData = \[\];[\s\S]*?return \{\s*name: b \? b\.nama_pelanggan : "Pelanggan",[\s\S]*?\};/m;

const newLogic = `let bookData = [];
    let custData = [];

    if (bookingIds.length > 0) {
      const { data: bData } = await supabase
        .from("booking_records")
        .select("no_booking, nama_pelanggan, no_phone, haircuts(nama_potongan), staff(branches(nama_cawangan))")
        .in("no_booking", bookingIds);
        
      const { data: tData } = await supabase
        .from("treatment_records")
        .select("no_booking, nama_pelanggan, no_phone, treatments(nama_rawatan), staff(branches(nama_cawangan))")
        .in("no_booking", bookingIds);

      bookData = [...(bData || []), ...(tData || [])];

      const phoneNumbers = bookData
        .map((b) => b.no_phone)
        .filter((phone) => phone && phone !== "-");

      if (phoneNumbers.length > 0) {
        const { data: cData } = await supabase
          .from("customers")
          .select("name, phone, avatar_url")
          .in("phone", phoneNumbers);
        custData = cData || [];
      }
    }

    let formattedReviews = (revData || []).map((r) => {
      let b = bookData.find((x) => x.no_booking === r.no_booking);
      let cust = null;
      if (b) {
        cust = custData.find(
          (c) => c.phone === b.no_phone || c.name === b.nama_pelanggan,
        );
      }
      
      let branchName = "Cawangan Dinspire";
      if (b && b.staff && b.staff.branches && b.staff.branches.nama_cawangan) {
          branchName = b.staff.branches.nama_cawangan;
      }

      return {
        name: b ? b.nama_pelanggan : "Pelanggan",
        service: b && b.haircuts ? b.haircuts.nama_potongan : (b && b.treatments ? b.treatments.nama_rawatan : "Servis Dinspire"),
        stars: r.bintang,
        text: r.review_text,
        avatar: cust && cust.avatar_url ? cust.avatar_url : "./Profile/1.png",
        branch: branchName
      };`;

shop = shop.replace(regexBook, newLogic);
fs.writeFileSync('routes/shop.js', shop);
console.log("Replaced logic");
