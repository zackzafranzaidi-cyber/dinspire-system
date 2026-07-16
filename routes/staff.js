const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");

// ==========================================
// 1. Papan Pemuka Tugasan Staf (Dashboard)
// ==========================================
router.get(
  "/dashboard",
  authenticate,
  requireRole(["staff", "owner"]),
  async (req, res) => {
    const staff_id = req.user.id;

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
          .select("*, haircuts(nama_potongan)")
          .eq("staff_id", staff_id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("walkin_records")
          .select("*, haircuts(nama_potongan)")
          .eq("staff_id", staff_id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("oncall_records")
          .select("*, haircuts(nama_potongan)")
          .eq("staff_id", staff_id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("treatment_records")
          .select("*, treatments(nama_rawatan)")
          .eq("staff_id", staff_id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      const commissionPercent = settingData
        ? parseFloat(settingData.setting_value)
        : 50;

      let allBookings = [];

      (bookings || []).forEach((b) => {
        allBookings.push({
          order_no: b.no_booking,
          customer: { name: b.nama_pelanggan },
          service: {
            name: b.haircuts ? b.haircuts.nama_potongan : "Guntingan",
          },
          booking_date: b.tarikh,
          booking_time: b.masa,
          price: b.harga_rm,
          status: b.status === "Belum" ? "Aktif" : "Selesai",
          payment_method: "QR",
        });
      });

      (treatments || []).forEach((t) => {
        allBookings.push({
          order_no: t.no_booking,
          customer: { name: t.nama_pelanggan },
          service: {
            name: t.treatments ? t.treatments.nama_rawatan : "Rawatan",
          },
          booking_date: t.tarikh,
          booking_time: t.masa,
          price: t.harga_rm,
          status: t.status === "Belum" ? "Aktif" : "Selesai",
          payment_method: "QR",
        });
      });

      (walkins || []).forEach((w) => {
        allBookings.push({
          order_no:
            "#WLK-" + (w.id ? w.id.substring(0, 4).toUpperCase() : "000"),
          customer: { name: w.nama_pelanggan },
          service: { name: w.haircuts ? w.haircuts.nama_potongan : "Walk-In" },
          booking_date: w.tarikh,
          booking_time: w.masa,
          price: w.harga_rm,
          status: "Selesai",
          payment_method: w.jenis_bayaran,
        });
      });

      (oncalls || []).forEach((o) => {
        allBookings.push({
          order_no: o.no_booking,
          customer: { name: o.nama_pelanggan },
          service: { name: o.haircuts ? o.haircuts.nama_potongan : "On-Call" },
          booking_date: o.tarikh,
          booking_time: o.masa,
          price: o.harga_rm,
          status: o.status === "Belum" ? "Aktif" : "Selesai",
          payment_method: "QR",
        });
      });

      // KIRA CASH ON HAND BULANAN SECARA TEPAT (AUTO-RESET)
      const now = new Date();
      const myTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Waktu Malaysia
      const firstDayOfMonth = new Date(myTime.getFullYear(), myTime.getMonth(), 1).toISOString().split("T")[0];
      
      const { data: monthlyCashData } = await supabase
        .from("walkin_records")
        .select("harga_rm")
        .eq("staff_id", staff_id)
        .gte("tarikh", firstDayOfMonth)
        .in("jenis_bayaran", ["Cash", "Tunai"]);

      let monthlyCashOnHand = 0;
      (monthlyCashData || []).forEach((w) => {
        monthlyCashOnHand += parseFloat(w.harga_rm) || 0;
      });

      res.json({
        status: "success",
        bookings: allBookings,
        commissionPercent: commissionPercent,
        monthlyCashOnHand: monthlyCashOnHand,
        reviews: [],
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({
          status: "error",
          message: "Ralat pelayan memuat turun dashboard.",
        });
    }
  },
);

// ==========================================
// [FUNGSI BAHARU] Formula Haversine (Geofencing GPS)
// ==========================================
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Hasilnya adalah Jarak dalam meter
}

// ⚠️ TUKAR KOORDINAT INI KEPADA KOORDINAT SEBENAR KEDAI ANDA ⚠️
const KEDAI_LAT = 3.0; // Contoh Latitud
const KEDAI_LON = 101.0; // Contoh Longitud
const MAKSIMUM_JARAK_METER = 500; // Staf wajib berada dalam lingkungan 500 meter dari kedai

// ==========================================
// 2. Rekod Kehadiran (Punch In / Punch Out) Dibaiki
// ==========================================
router.post(
  "/punch",
  authenticate,
  requireRole(["staff"]),
  async (req, res) => {
    // Kini menerima nilai latitud dan longitud dari peranti frontend
    const { type, location, lat, lon } = req.body;
    const staff_id = req.user.id;
    const username = req.user.username;

    // Semakan Geofencing untuk staf (Wajib berada di kedai)
    if (!lat || !lon || lat === 0 || lon === 0) {
      return res.status(403).json({
        status: "error",
        message: "Koordinat GPS tidak sah. Lokasi wajib diaktifkan dan tepat.",
      });
    }

    const jarakDariKedai = hitungJarak(lat, lon, KEDAI_LAT, KEDAI_LON);
    if (jarakDariKedai > MAKSIMUM_JARAK_METER) {
      return res.status(403).json({
        status: "error",
        message: `Anda berada ${(jarakDariKedai / 1000).toFixed(1)} km dari kedai. Tolong Punch di dalam kedai!`,
      });
    }

    const now = new Date();
    const myTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Waktu Malaysia
    const tarikh = myTime.toISOString().split("T")[0];
    const hari = myTime.toLocaleDateString("ms-MY", { weekday: "long" });
    const masa = myTime.toISOString().split("T")[1].substring(0, 8);

    try {
      if (type === "CLOCK IN") {
        const { data: stData } = await supabase
          .from("staff")
          .select("branch_id")
          .eq("id", staff_id)
          .single();
        let namaCawangan = "Cawangan Utama";

        if (stData && stData.branch_id) {
          const { data: brData } = await supabase
            .from("branches")
            .select("nama_cawangan")
            .eq("id", stData.branch_id)
            .single();
          if (brData) namaCawangan = brData.nama_cawangan;
        }

        const { data: existPunch } = await supabase.from("punch_cards").select("id").eq("staff_id", staff_id).eq("tarikh", tarikh).single();
        if (existPunch) {
          return res.status(400).json({ status: "error", message: "Anda sudah Punch In hari ini." });
        }

        const { error } = await supabase.from("punch_cards").insert([
          {
            staff_id: staff_id,
            nama: username,
            tarikh: tarikh,
            hari: hari,
            waktu_in: masa,
            lokasi: location,
            cawangan: namaCawangan,
          },
        ]);

        if (error) throw error;
        res.json({
          status: "success",
          message: "Berjaya Punch In di " + namaCawangan,
        });
      } else if (type === "CLOCK OUT") {
        const { error } = await supabase
          .from("punch_cards")
          .update({ waktu_out: masa })
          .eq("staff_id", staff_id)
          .eq("tarikh", tarikh);

        if (error) throw error;
        res.json({ status: "success", message: "Berjaya Punch Out" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "error", message: "Ralat sistem pangkalan data." });
    }
  },
);

module.exports = router;
