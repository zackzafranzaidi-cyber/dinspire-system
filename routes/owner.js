const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const { generateBusinessInsights } = require("../utils/ai");
const rateLimit = require("express-rate-limit");

// [DIBAIKI] AI Billing Exhaustion Prevention (Limit 5 req / 5 min)
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { status: "error", message: "Had pertanyaan AI tercapai. Sila tunggu 5 minit untuk menyejukkan enjin AI." }
});

router.get(
  "/dashboard",
  authenticate,
  requireRole(["owner"]),
  async (req, res) => {
    try {
      const [
        { data: settingData },
        { data: bookings },
        { data: walkins },
        { data: oncalls },
        { data: treatments },
      ] = await Promise.all([
        supabase
          .from("settings")
          .select("setting_value")
          .eq("setting_key", "peratus_komisen")
          .single(),
        supabase
          .from("booking_records")
          .select("*, staff(username), haircuts(nama_potongan)")
          .order("created_at", { ascending: false }),
        supabase
          .from("walkin_records")
          .select("*, staff(username), haircuts(nama_potongan, kategori)")
          .order("created_at", { ascending: false }),
        supabase
          .from("oncall_records")
          .select("*, staff(username), haircuts(nama_potongan)")
          .order("created_at", { ascending: false }),
        supabase
          .from("treatment_records")
          .select("*, staff(username), treatments(nama_rawatan)")
          .order("created_at", { ascending: false }),
      ]);
      const commissionPercent = settingData
        ? parseFloat(settingData.setting_value)
        : 50;

      let allTransactions = [];

      (bookings || []).forEach((b) => {
        allTransactions.push({
          OrderNo: b.no_booking,
          Username: b.nama_pelanggan,
          Phone: b.no_phone || "Tiada", // [DIBAIKI]
          Date: b.tarikh,
          Time: b.masa,
          ServiceName: b.haircuts ? b.haircuts.nama_potongan : "-",
          Barber: b.staff ? b.staff.username : "-",
          Price: b.harga_rm,
          Fee: parseFloat(b.service_fee) || 0,
          Type: b.jenis_bayaran || (b.resit && b.resit.toLowerCase().includes("fpx") ? "FPX" : "QR"),
          Category: "Booking",
          Status: b.status,
          Timestamp: b.created_at,
          ReceiptLink: b.resit || "",
        });
      });

      (treatments || []).forEach((t) => {
        allTransactions.push({
          OrderNo: t.no_booking,
          Username: t.nama_pelanggan,
          Phone: t.no_phone || "Tiada", // [DIBAIKI]
          Date: t.tarikh,
          Time: t.masa,
          ServiceName: t.treatments ? t.treatments.nama_rawatan : "-",
          Barber: t.staff ? t.staff.username : "-",
          Price: t.harga_rm,
          Fee: parseFloat(t.service_fee) || 0,
          Type: t.jenis_bayaran || (t.resit && t.resit.toLowerCase().includes("fpx") ? "FPX" : "QR"),
          Category: "Treatment",
          Status: t.status,
          Timestamp: t.created_at,
          ReceiptLink: t.resit || "",
        });
      });

      (walkins || []).forEach((w) => {
        allTransactions.push({
          OrderNo:
            "#WLK-" +
            (w.id ? String(w.id).substring(0, 4).toUpperCase() : "000"),
          Username: w.nama_pelanggan,
          Phone: w.no_phone || "Tiada", // [DIBAIKI]
          Date: w.tarikh,
          Time: w.masa,
          ServiceName: w.haircuts ? w.haircuts.nama_potongan : "-",
          Barber: w.staff ? w.staff.username : "-",
          Price: w.harga_rm,
          Fee: parseFloat(w.service_fee) || 0,
          Type: w.jenis_bayaran,
          Category: (w.haircuts && w.haircuts.kategori === "Treatment Walk-in") ? "Treatment" : "Walk-In",
          Status: "Selesai",
          Timestamp: w.created_at,
          ReceiptLink: w.resit || "",
        });
      });

      (oncalls || []).forEach((o) => {
        allTransactions.push({
          OrderNo: o.no_booking,
          Username: o.nama_pelanggan,
          Phone: o.no_phone || "Tiada", // [DIBAIKI]
          Date: o.tarikh,
          Time: o.masa,
          ServiceName: o.haircuts ? o.haircuts.nama_potongan : "-",
          Barber: o.staff ? o.staff.username : "-",
          Price: o.harga_rm,
          Fee: parseFloat(o.service_fee) || 0,
          Type: o.jenis_bayaran || (o.resit && o.resit.toLowerCase().includes("fpx") ? "FPX" : "QR"),
          Category: "On-Call",
          Status: o.status,
          Timestamp: o.created_at,
          ReceiptLink: o.resit || "",
        });
      });

      const [
        { data: productOrders },
        { data: punchCards },
        { data: reviews },
        { data: staffList },
        { data: branchList },
        { data: staffLeaves },
      ] = await Promise.all([
        supabase
          .from("product_orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("punch_cards")
          .select("*, staff(username)")
          .order("tarikh", { ascending: false }),
        supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("staff").select("username, jenis_staf, branch_id"),
        supabase.from("branches").select("id, nama_cawangan"),
        supabase.from("staff_leaves").select("*, staff(username)").order("tarikh", { ascending: true }),
      ]);

      let mapBarberBranch = {};
      (staffList || []).forEach((s) => {
        if (s.jenis_staf === "On-Call") {
          mapBarberBranch[s.username] = "On-Call";
        } else if (s.branch_id) {
          // Cari nama cawangan berdasarkan branch_id staf
          let br = (branchList || []).find((b) => b.id === s.branch_id);
          mapBarberBranch[s.username] = br
            ? br.nama_cawangan
            : "Tidak Ditetapkan";
        } else {
          mapBarberBranch[s.username] = "Tidak Ditetapkan";
        }
      });

      res.json({
        status: "success",
        masterData: {
          bookings: allTransactions,
          punchCard: punchCards || [],
          staffLeaves: staffLeaves || [],
          orders: productOrders || [],
          reviews: reviews || [],
          commissionPercent: commissionPercent,
        },
        mapBarberBranch: mapBarberBranch,
      });
    } catch (error) {
      console.error("Ralat Dashboard Owner:", error);
      res
        .status(500)
        .json({ status: "error", message: "Gagal memuatkan data dashboard." });
    }
  },
);

// ==========================================
// KELULUSAN CUTI KECEMASAN
// ==========================================
router.post("/approve-emergency-leave", authenticate, requireRole(["owner", "admin"]), async (req, res) => {
  const { leave_id, action } = req.body; // action: 'Approve' or 'Reject'
  
  if (!leave_id || !action) return res.status(400).json({ status: "error", message: "Data tidak lengkap." });

  try {
    // Dapatkan butiran cuti
    const { data: leave } = await supabase.from("staff_leaves").select("*, staff(branch_id)").eq("id", leave_id).single();
    if (!leave) return res.status(404).json({ status: "error", message: "Cuti tidak dijumpai." });

    if (action === 'Reject') {
      await supabase.from("staff_leaves").update({ status: 'Rejected' }).eq("id", leave_id);
      return res.json({ status: "success", message: "Cuti Kecemasan telah Ditolak." });
    }

    const branch_id = leave.staff ? leave.staff.branch_id : null;

    // Jika Approve, semak pertembungan booking pada tarikh tersebut
    const [bReq, tReq, oReq] = await Promise.all([
      supabase.from("booking_records").select("no_booking, masa, tarikh, haircuts(nama_potongan)").eq("staff_id", leave.staff_id).eq("tarikh", leave.tarikh).eq("status", "Belum"),
      supabase.from("treatment_records").select("no_booking, masa, tarikh, treatments(nama_rawatan)").eq("staff_id", leave.staff_id).eq("tarikh", leave.tarikh).eq("status", "Belum"),
      supabase.from("oncall_records").select("no_booking, masa, tarikh, haircuts(nama_potongan)").eq("staff_id", leave.staff_id).eq("tarikh", leave.tarikh).eq("status", "Belum")
    ]);

    let conflicts = [];
    if (bReq.data) conflicts = conflicts.concat(bReq.data.map(b => ({ ...b, table: 'booking_records', type: 'Booking', service: b.haircuts ? b.haircuts.nama_potongan : 'Servis' })));
    if (tReq.data) conflicts = conflicts.concat(tReq.data.map(b => ({ ...b, table: 'treatment_records', type: 'Treatment', service: b.treatments ? b.treatments.nama_rawatan : 'Rawatan' })));
    if (oReq.data) conflicts = conflicts.concat(oReq.data.map(b => ({ ...b, table: 'oncall_records', type: 'On-Call', service: b.haircuts ? b.haircuts.nama_potongan : 'On-Call' })));

    if (conflicts.length > 0) {
      // Dapatkan senarai staf lain di cawangan yang sama
      let otherStaff = [];
      if (branch_id) {
        const { data } = await supabase.from("staff")
          .select("id, username")
          .eq("branch_id", branch_id)
          .neq("id", leave.staff_id);
        otherStaff = data || [];
      }
        
      const otherStaffIds = otherStaff.map(s => s.id);
      
      let allOtherStaffBookings = [];
      let allOtherStaffTreatments = [];
      let allOtherStaffOncalls = [];
      let allOtherStaffLeaves = [];
      
      if (otherStaffIds.length > 0) {
        const [oBReq, oTReq, oOReq, oLReq] = await Promise.all([
          supabase.from("booking_records").select("staff_id, masa").in("staff_id", otherStaffIds).eq("tarikh", leave.tarikh).eq("status", "Belum"),
          supabase.from("treatment_records").select("staff_id, masa").in("staff_id", otherStaffIds).eq("tarikh", leave.tarikh).eq("status", "Belum"),
          supabase.from("oncall_records").select("staff_id, masa").in("staff_id", otherStaffIds).eq("tarikh", leave.tarikh).eq("status", "Belum"),
          supabase.from("staff_leaves").select("staff_id").in("staff_id", otherStaffIds).eq("tarikh", leave.tarikh).not("status", "eq", "Rejected")
        ]);
        allOtherStaffBookings = oBReq.data || [];
        allOtherStaffTreatments = oTReq.data || [];
        allOtherStaffOncalls = oOReq.data || [];
        allOtherStaffLeaves = oLReq.data || [];
      }
      
      // Untuk setiap konflik, cari staf yang tiada tempahan pada masa tersebut dan tiada cuti pada hari tersebut
      conflicts = conflicts.map(c => {
        let available_staff = otherStaff.filter(s => {
          // Jika staf cuti pada hari tersebut, dia tidak available
          const hasLeave = allOtherStaffLeaves.find(l => l.staff_id === s.id);
          if (hasLeave) return false;
          
          // Periksa jika staf ada tempahan pada masa 'c.masa'
          const hasBooking = allOtherStaffBookings.find(b => b.staff_id === s.id && b.masa === c.masa);
          const hasTreatment = allOtherStaffTreatments.find(t => t.staff_id === s.id && t.masa === c.masa);
          const hasOncall = allOtherStaffOncalls.find(o => o.staff_id === s.id && o.masa === c.masa);
          
          if (hasBooking || hasTreatment || hasOncall) return false;
          return true;
        });
        return { ...c, available_staff };
      });

      // Return amaran konflik berserta data untuk reassignment
      return res.status(409).json({
        status: "conflict",
        message: "Terdapat tempahan yang bertembung pada tarikh ini.",
        conflicts: conflicts
      });
    }

    // Tiada konflik, terus Approve
    await supabase.from("staff_leaves").update({ status: 'Approved' }).eq("id", leave_id);
    
    // Padam kesemua cuti 'Biasa' yang berbaki pada bulan semasa untuk staf ini
    const today = new Date();
    const myTime = new Date(today.getTime() + 8 * 60 * 60 * 1000);
    const todayStr = myTime.toISOString().split('T')[0];
    const year = myTime.getFullYear();
    const month = myTime.getMonth(); 
    const firstDayNextMonth = new Date(year, month + 1, 1).toISOString().split('T')[0];
    
    await supabase.from("staff_leaves")
       .delete()
       .eq("staff_id", leave.staff_id)
       .eq("jenis_cuti", "Biasa")
       .gte("tarikh", todayStr)
       .lt("tarikh", firstDayNextMonth);
       
    res.json({ status: "success", message: "Cuti Kecemasan Berjaya Diluluskan! Baki cuti asal bulan ini telah ditukar." });
  } catch (error) {
    console.error("Ralat kelulusan cuti:", error);
    res.status(500).json({ status: "error", message: "Ralat pelayan." });
  }
});

// ==========================================
// TUKAR STAF UNTUK BOOKING BERKOLIZI (REASSIGN)
// ==========================================
router.post("/reassign-booking", authenticate, requireRole(["owner", "admin"]), async (req, res) => {
  let { no_booking, new_staff_id, table_name } = req.body;
  no_booking = String(no_booking || "");
  if (!no_booking || !new_staff_id || !table_name) return res.status(400).json({ status: "error", message: "Data tidak lengkap." });
  
  const ALLOWED_TABLES = ["booking_records", "treatment_records", "oncall_records"];
  if (!ALLOWED_TABLES.includes(table_name)) return res.status(400).json({ status: "error", message: "Jadual tidak sah." });

  try {
    const { data: bData } = await supabase.from(table_name).select("*").eq("no_booking", no_booking).single();
    if (!bData) return res.status(404).json({ status: "error", message: "Booking tidak dijumpai." });

    const { data: newStaff } = await supabase.from("staff").select("username, branch_id").eq("id", new_staff_id).single();
    const { data: oldStaff } = await supabase.from("staff").select("username").eq("id", bData.staff_id).single();
    
    let cawangan = "Cawangan";
    if (newStaff && newStaff.branch_id) {
       const { data: br } = await supabase.from("branches").select("nama_cawangan").eq("id", newStaff.branch_id).single();
       if (br) cawangan = br.nama_cawangan;
    }

    const { error } = await supabase.from(table_name).update({ staff_id: new_staff_id }).eq("no_booking", no_booking);
    if (error) throw error;

    res.json({ 
      status: "success", 
      message: "Booking berjaya dipindahkan ke staf lain.",
      bookingDetails: bData,
      new_barber_name: newStaff ? newStaff.username : "Staf",
      old_barber_name: oldStaff ? oldStaff.username : "Staf Asal",
      cawangan: cawangan
    });
  } catch (error) {
    console.error("Ralat tukar staf:", error);
    res.status(500).json({ status: "error", message: "Ralat pelayan semasa memindahkan booking." });
  }
});

// ==========================================
// BATAL BOOKING (OLEH ADMIN) DENGAN WHATSAPP
// ==========================================
router.post("/cancel-booking-admin", authenticate, requireRole(["owner", "admin"]), async (req, res) => {
  let { no_booking, table_name } = req.body;
  no_booking = String(no_booking || "");
  if (!no_booking || !table_name) return res.status(400).json({ status: "error", message: "Data tidak lengkap." });

  const ALLOWED_TABLES = ["booking_records", "treatment_records", "oncall_records"];
  if (!ALLOWED_TABLES.includes(table_name)) return res.status(400).json({ status: "error", message: "Jadual tidak sah." });

  try {
    // Semak pelanggan dan details
    const { data: bData } = await supabase.from(table_name).select("*").eq("no_booking", no_booking).single();
    if (!bData) return res.status(404).json({ status: "error", message: "Booking tidak dijumpai." });

    // Update status Batal dan cancelled_by = 'admin'
    const { error } = await supabase.from(table_name).update({ status: "Batal", cancelled_by: "admin" }).eq("no_booking", no_booking);
    if (error) throw error;

    res.json({ status: "success", message: "Booking dibatalkan.", bookingDetails: bData });
  } catch (error) {
    console.error("Ralat batal booking admin:", error);
    res.status(500).json({ status: "error", message: "Ralat pelayan semasa membatalkan booking." });
  }
});

// ==========================================
// [BAHARU] Laluan Cerdas: Analisis AI (AI Insights)
// ==========================================
router.post(
  "/ai-insights",
  authenticate,
  requireRole(["owner"]),
  aiLimiter, // [DIBAIKI] Sekatan AI Billing Exhaustion
  async (req, res) => {
    const { prompt, activeTab, timeFilter } = req.body;

    // [DIBAIKI] AI Payload Bloat (Letupan Pengebilan Token) & Type Confusion
    const safePrompt = String(prompt || "").substring(0, 500);
    const safeTab = String(activeTab || "").substring(0, 100);
    const safeTimeFilter = String(timeFilter || "").substring(0, 50);

    if (!safePrompt)
      return res
        .status(400)
        .json({
          status: "error",
          message: "Sila masukkan soalan atau arahan.",
        });

    try {
      // 1. Tarik Data Utama untuk Konteks AI (Menggunakan Promise.all untuk kelajuan)
      const [
        { data: bookings },
        { data: productOrders },
        { data: punchCards },
        { data: reviews },
        { data: histBookings },
        { data: histWalkins },
        { data: histTreatments },
        { data: historicalSales }
      ] = await Promise.all([
        supabase
          .from("booking_records")
          .select("tarikh, masa, harga_rm, status, staff(username)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("product_orders")
          .select("senarai_produk, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("punch_cards")
          .select("tarikh, waktu_in, waktu_out, staff(username)")
          .order("tarikh", { ascending: false })
          .limit(30),
        supabase
          .from("reviews")
          .select("bintang, review_text, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        // Untuk Laporan Jualan Bulanan dan Prestasi Staf (Historical Data)
        supabase.from("booking_records").select("tarikh, harga_rm, staff(username)").eq("status", "Selesai").order("created_at", { ascending: false }).limit(2000),
        supabase.from("walkin_records").select("tarikh, harga_rm, staff(username)").order("created_at", { ascending: false }).limit(2000),
        supabase.from("treatment_records").select("tarikh, harga_rm, staff(username)").eq("status", "Selesai").order("created_at", { ascending: false }).limit(2000),
        supabase.from("historical_sales").select("*").order("tahun", { ascending: false }).limit(24),
      ]);

      // 1.5 Kira Jualan Bulanan Secara Agregat (Tahun/Bulan) dan Prestasi Staf
      let LaporanJualanBulanan = {};
      let PrestasiStaf = {};

      const kumpulJualan = (rekod) => {
        (rekod || []).forEach(r => {
          if (r.tarikh) {
            const bulan = r.tarikh.substring(0, 7); // Cth: "2023-06"
            if (!LaporanJualanBulanan[bulan]) LaporanJualanBulanan[bulan] = 0;
            LaporanJualanBulanan[bulan] += parseFloat(r.harga_rm) || 0;
          }
          
          if (r.staff && r.staff.username) {
            const nama = r.staff.username;
            if (!PrestasiStaf[nama]) PrestasiStaf[nama] = { jualan_rm: 0, jumlah_pelanggan: 0 };
            PrestasiStaf[nama].jualan_rm += parseFloat(r.harga_rm) || 0;
            PrestasiStaf[nama].jumlah_pelanggan += 1;
          }
        });
      };
      kumpulJualan(histBookings);
      kumpulJualan(histWalkins);
      kumpulJualan(histTreatments);

      // Tambah data daripada arkib tahun lepas (historical_sales)
      (historicalSales || []).forEach(h => {
        let blnStr = String(h.bulan).padStart(2, "0");
        let thnBln = `${h.tahun}-${blnStr}`;
        
        if (!LaporanJualanBulanan[thnBln]) LaporanJualanBulanan[thnBln] = 0;
        LaporanJualanBulanan[thnBln] += parseFloat(h.total_jualan_servis) + parseFloat(h.total_jualan_produk);

        if (h.top_staff && h.top_staff.nama) {
          let sName = h.top_staff.nama;
          if (!PrestasiStaf[sName]) PrestasiStaf[sName] = { jualan_rm: 0, jumlah_pelanggan: 0 };
          // Anggaran kasar dari arkib
          PrestasiStaf[sName].jualan_rm += parseFloat(h.total_jualan_servis); 
          PrestasiStaf[sName].jumlah_pelanggan += parseInt(h.top_staff.jumlah_servis || 0);
        }
      });

      // 2. Formatkan data supaya mudah dibaca oleh AI (Kurangkan token)
      const businessContext = {
        LaporanJualanBulanan: LaporanJualanBulanan, // AI kini tahu jualan bulan-bulan lepas!
        PrestasiStafKeseluruhan: PrestasiStaf, // AI kini tahu siapa barber paling banyak jualan/pelanggan!
        RingkasanTempahanTerkini: bookings,
        RingkasanJualanProduk: productOrders,
        RekodKehadiranStaf: punchCards,
        MaklumBalasPelanggan: reviews,
      };

      // 3. Hantar ke Enjin AI Gemini berserta konteks AI semasa
      const aiResponseText = await generateBusinessInsights(
        safePrompt,
        businessContext,
        safeTab,
        safeTimeFilter,
      );

      // 4. Pulangkan hasil kepada UI
      res.json({
        status: "success",
        response: aiResponseText,
      });
    } catch (error) {
      console.error("Ralat Laluan AI:", error);
      res
        .status(500)
        .json({ status: "error", message: "Gagal menjana analisis AI. Sila cuba lagi." });
    }
  },
);

// ==========================================
// X. Pengesahan Bayaran Produk E-Commerce
// ==========================================
router.post(
  "/verify-product-payment",
  authenticate,
  requireRole(["owner"]),
  async (req, res) => {
    let { order_id, action } = req.body;
    order_id = String(order_id || "");
    try {
      if (action === "approve") {
        const { error } = await supabase
          .from("product_orders")
          .update({ status: "Preparing" })
          .eq("id", order_id);
        if (error) throw error;
        return res.json({ status: "success", message: "Bayaran produk diluluskan. Sila proses tempahan." });
      } else if (action === "reject") {
        const { error } = await supabase
          .from("product_orders")
          .update({ status: "Rejected" })
          .eq("id", order_id);
        if (error) throw error;
        return res.json({ status: "success", message: "Bayaran ditolak. Resit dibatalkan." });
      } else {
        return res.status(400).json({ error: "Tindakan tidak sah" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", message: "Ralat pelayan memproses pengesahan produk." });
    }
  }
);

// Pemasaran (Marketing) - Ekstrak Pelanggan Tanpa Berulang
router.get(
  "/marketing-customers",
  authenticate,
  requireRole(["owner"]),
  async (req, res) => {
    try {
      const [resCustomers, resWalkins] = await Promise.all([
        supabase.from("customers").select("name, phone"),
        supabase.from("walkin_records").select("nama_pelanggan, no_phone").not("no_phone", "is", null)
      ]);
      
      const customers = resCustomers.data;
      const walkins = resWalkins.data;
      
      const uniqueCustomers = new Map();
      
      const formatPhone = (phone) => {
        let p = String(phone).replace(/\D/g, "");
        if (p.startsWith("0")) p = "6" + p;
        else if (p.startsWith("+60")) p = p.substring(1);
        else if (!p.startsWith("60")) p = "60" + p;
        return p;
      };

      (walkins || []).forEach(w => {
        if (w.no_phone) {
          const p = formatPhone(w.no_phone);
          if (p.length > 5 && !uniqueCustomers.has(p)) {
            uniqueCustomers.set(p, { name: w.nama_pelanggan || "Walk-In", phone: p, source: "Walk-In" });
          }
        }
      });
      
      (customers || []).forEach(c => {
        if (c.phone) {
          const p = formatPhone(c.phone);
          if (p.length > 5) {
            uniqueCustomers.set(p, { name: c.name || "Pelanggan Dinspire", phone: p, source: "Berdaftar" });
          }
        }
      });

      res.json(Array.from(uniqueCustomers.values()));
    } catch (err) {
      console.error("Marketing API Error:", err);
      res.status(500).json({ error: "Ralat pelayan: " + err.message });
    }
  }
);

const { generateMonthlyArchiveData, generateArchiveDataByDateRange, pruneYearlyData } = require("../utils/archiver");

// ========================================================
// [BAHARU] Laporan & Arkib Jualan API (Protected)
// ========================================================

router.get("/trigger-pruning", authenticate, requireRole(["owner"]), async (req, res) => {
  try {
    await pruneYearlyData();
    res.json({ status: "success", message: "Proses pembersihan & kompresi (pruning) berjaya disimulasikan." });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/monthly-archive-data", authenticate, requireRole(["owner"]), async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).send("Parameter month dan year diperlukan.");
    }
    const archiveData = await generateMonthlyArchiveData(month, year);
    res.json(archiveData);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/reports-data", authenticate, requireRole(["owner"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).send("Parameter startDate dan endDate diperlukan.");
    }
    const archiveData = await generateArchiveDataByDateRange(startDate, endDate);
    res.json(archiveData);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/historical-years", authenticate, requireRole(["owner"]), async (req, res) => {
  try {
    const { data } = await supabase.from("historical_sales").select("tahun").order("tahun", { ascending: false });
    if (!data) return res.json([]);
    const uniqueYears = [...new Set(data.map(item => item.tahun))];
    res.json(uniqueYears.map(y => ({ tahun: y })));
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/historical-data", authenticate, requireRole(["owner"]), async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).send("Parameter year diperlukan");
    const { data } = await supabase.from("historical_sales").select("*").eq("tahun", year).order("bulan", { ascending: true });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
