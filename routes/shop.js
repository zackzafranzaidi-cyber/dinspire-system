const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const cache = require("../utils/cache");

router.get("/", async (req, res) => {
  try {
    const cachedData = cache.get("shop_data");
    if (cachedData) {
      console.log("[CACHE HIT] shop_data");
      res.setHeader("Cache-Control", "public, max-age=300"); // [DIBAIKI] Browser Caching 5 Minit
      return res.json(cachedData);
    }

    const [
      { data: hcData, error: e1 },
      { data: trData, error: e2 },
      { data: brData, error: e3 },
      { data: stData, error: e4 },
      { data: prData, error: e5 },
      { data: allSettings, error: e6 },
      { count: customerCount, error: e7 },
      { count: walkinCount, error: e8 },
    ] = await Promise.all([
      supabase.from("haircuts").select("*").limit(200),
      supabase.from("treatments").select("*").limit(200),
      supabase.from("branches").select("*").limit(50),
      supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment").limit(100),
      supabase.from("products").select("*").limit(200),
      // [DIBAIKI] Ketirisan Rahsia Syarikat: Jangan fetch peratus_komisen
      supabase.from("settings").select("setting_key, setting_value").in("setting_key", ["posters", "shipping_fee", "service_fee"]).limit(50),
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("walkin_records").select("*", { count: "exact", head: true }),
    ]);

    if (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8) {
      throw (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8);
    }

    let posters = [];
    let shippingFee = 0.0;
    let serviceFee = 0.0;

    (allSettings || []).forEach((s) => {
      if (s.setting_key === "posters") {
        try {
          posters = JSON.parse(s.setting_value);
        } catch (e) {}
      }
      if (s.setting_key === "shipping_fee")
        shippingFee = parseFloat(s.setting_value) || 0;
      if (s.setting_key === "service_fee")
        serviceFee = parseFloat(s.setting_value) || 0;
    });

    // ==========================================
    // [DIBAIKI] OPTIMASI PANGKALAN DATA (ELAK BOTTLENECK)
    // ==========================================

    // 1. Ambil 10 ulasan terbaru sahaja
    const { data: revData } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    // 2. Ekstrak senarai 'no_booking' daripada 10 ulasan tersebut
    const bookingIds = (revData || [])
      .map((r) => r.no_booking)
      .filter((id) => id);

    let bookData = [];
    let custData = [];

    if (bookingIds.length > 0) {
      // 3. HANYA tarik rekod tempahan yang berkaitan dengan ulasan (Bukan tarik semua)
      const { data: bData } = await supabase
        .from("booking_records")
        .select("no_booking, nama_pelanggan, no_phone, haircuts(nama_potongan), staff(branches(nama_cawangan))")
        .in("no_booking", bookingIds);
      bookData = bData || [];

      // 4. Ekstrak nombor telefon untuk cari avatar pelanggan
      const phoneNumbers = bookData
        .map((b) => b.no_phone)
        .filter((phone) => phone && phone !== "-");

      if (phoneNumbers.length > 0) {
        // HANYA tarik data pelanggan yang berkaitan
        const { data: cData } = await supabase
          .from("customers")
          .select("name, phone, avatar_url")
          .in("phone", phoneNumbers);
        custData = cData || [];
      }
    }

    // Format ulasan untuk dipaparkan di frontend
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
        service: b && b.haircuts ? b.haircuts.nama_potongan : "Servis Dinspire",
        stars: r.bintang,
        text: r.review_text,
        avatar: cust && cust.avatar_url ? cust.avatar_url : "./Profile/1.png",
        branch: branchName
      };
    });

    const result = {
      Haircuts: (hcData || [])
        .filter((h) => h.kategori === "Booking")
        .map((h) => ({
          id: h.id,
          name: h.nama_potongan,
          desc: h.diskripsi,
          price: h.harga,
        })),
      Treatments: (trData || []).map((t) => ({
        id: t.id,
        name: t.nama_rawatan,
        desc: t.diskripsi,
        price: t.harga,
      })),
      OnCall: (hcData || [])
        .filter((h) => h.kategori === "On-Call")
        .map((h) => ({
          id: h.id,
          name: h.nama_potongan,
          serviceName: h.nama_potongan,
          price: h.harga,
        })),
      WalkInServices: (hcData || [])
        .filter((h) => h.kategori === "Walk-in" || h.kategori === "Treatment Walk-in")
        .map((h) => ({ id: h.id, name: h.kategori === "Treatment Walk-in" ? `${h.nama_potongan} (Rawatan)` : h.nama_potongan, price: h.harga, kategori: h.kategori })),
      Branches: (brData || []).map((b) => ({
        id: b.id,
        name: b.nama_cawangan,
        location: b.lokasi,
      })),
      Barbers: (stData || [])
        .filter((s) => s.jenis_staf === "In-Branch")
        .map((s) => ({ id: s.id, name: s.username, branch_id: s.branch_id, can_haircut: s.can_haircut !== false, can_treatment: s.can_treatment !== false })),
      OnCallBarbers: (stData || [])
        .filter((s) => s.jenis_staf === "On-Call")
        .map((s) => ({ id: s.id, name: s.username })),
      Products: (prData || []).map((p) => ({
        id: p.id,
        name: p.nama,
        price: p.harga,
        imageUrl: p.gambar,
        stok: p.stok,
      })),
      Posters: posters,
      Reviews: formattedReviews,
      Settings: { shippingFee, serviceFee },
      TotalCustomers: (customerCount || 0) + (walkinCount || 0),
    };

    cache.set("shop_data", result, 300); // Set cache selama 5 minit
    res.json(result);
  } catch (error) {
    console.error("Ralat memuat turun shop-data:", error);
    res
      .status(500)
      .json({ status: "error", message: "Gagal memuat turun data kedai" });
  }
});

module.exports = router;
