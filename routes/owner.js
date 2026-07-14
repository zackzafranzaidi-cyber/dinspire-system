const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const { generateBusinessInsights } = require("../utils/ai");

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
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("walkin_records")
          .select("*, staff(username), haircuts(nama_potongan)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("oncall_records")
          .select("*, staff(username), haircuts(nama_potongan)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("treatment_records")
          .select("*, staff(username), treatments(nama_rawatan)")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      const commissionPercent = settingData
        ? parseFloat(settingData.setting_value)
        : 50;

      let allTransactions = [];

      (bookings || []).forEach((b) => {
        allTransactions.push({
          OrderNo: b.no_booking,
          Username: b.nama_pelanggan,
          Date: b.tarikh,
          Time: b.masa,
          ServiceName: b.haircuts ? b.haircuts.nama_potongan : "-",
          Barber: b.staff ? b.staff.username : "-",
          Price: b.harga_rm,
          Fee: parseFloat(b.service_fee) || 0,
          Type: "QR (Booking)",
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
          Date: t.tarikh,
          Time: t.masa,
          ServiceName: t.treatments ? t.treatments.nama_rawatan : "-",
          Barber: t.staff ? t.staff.username : "-",
          Price: t.harga_rm,
          Fee: parseFloat(t.service_fee) || 0,
          Type: "QR (Treatment)",
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
          Date: w.tarikh,
          Time: w.masa,
          ServiceName: w.haircuts ? w.haircuts.nama_potongan : "-",
          Barber: w.staff ? w.staff.username : "-",
          Price: w.harga_rm,
          Fee: parseFloat(w.service_fee) || 0,
          Type: w.jenis_bayaran,
          Category: "Walk-In",
          Status: "Selesai",
          Timestamp: w.created_at,
          ReceiptLink: w.resit || "",
        });
      });

      (oncalls || []).forEach((o) => {
        allTransactions.push({
          OrderNo: o.no_booking,
          Username: o.nama_pelanggan,
          Date: o.tarikh,
          Time: o.masa,
          ServiceName: o.haircuts ? o.haircuts.nama_potongan : "-",
          Barber: o.staff ? o.staff.username : "-",
          Price: o.harga_rm,
          Fee: parseFloat(o.service_fee) || 0,
          Type: "QR (OnCall)",
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
      ] = await Promise.all([
        supabase
          .from("product_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("punch_cards")
          .select("*, staff(username)")
          .order("tarikh", { ascending: false })
          .limit(200),
        supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("staff").select("username, jenis_staf, branch_id"),
        supabase.from("branches").select("id, nama_cawangan"),
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
// [BAHARU] Laluan Cerdas: Analisis AI (AI Insights)
// ==========================================
router.post(
  "/ai-insights",
  authenticate,
  requireRole(["owner"]),
  async (req, res) => {
    const { prompt, activeTab, timeFilter } = req.body;
    if (!prompt)
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
        { data: histTreatments }
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
        // Untuk Laporan Jualan Bulanan (Historical Data)
        supabase.from("booking_records").select("tarikh, harga_rm").eq("status", "Selesai").order("created_at", { ascending: false }).limit(500),
        supabase.from("walkin_records").select("tarikh, harga_rm").order("created_at", { ascending: false }).limit(500),
        supabase.from("treatment_records").select("tarikh, harga_rm").eq("status", "Selesai").order("created_at", { ascending: false }).limit(500),
      ]);

      // 1.5 Kira Jualan Bulanan Secara Agregat (Tahun/Bulan)
      let LaporanJualanBulanan = {};
      const kumpulJualan = (rekod) => {
        (rekod || []).forEach(r => {
          if (r.tarikh) {
            const bulan = r.tarikh.substring(0, 7); // Cth: "2023-06"
            if (!LaporanJualanBulanan[bulan]) LaporanJualanBulanan[bulan] = 0;
            LaporanJualanBulanan[bulan] += parseFloat(r.harga_rm) || 0;
          }
        });
      };
      kumpulJualan(histBookings);
      kumpulJualan(histWalkins);
      kumpulJualan(histTreatments);

      // 2. Formatkan data supaya mudah dibaca oleh AI (Kurangkan token)
      const businessContext = {
        LaporanJualanBulanan: LaporanJualanBulanan, // AI kini tahu jualan bulan-bulan lepas!
        RingkasanTempahanTerkini: bookings,
        RingkasanJualanProduk: productOrders,
        RekodKehadiranStaf: punchCards,
        MaklumBalasPelanggan: reviews,
      };

      // 3. Hantar ke Enjin AI Gemini berserta konteks UI semasa
      const aiResponseText = await generateBusinessInsights(
        prompt,
        businessContext,
        activeTab,
        timeFilter,
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

module.exports = router;
