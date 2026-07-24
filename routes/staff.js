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

      const { data: branchesData } = await supabase.from("branches").select("id, nama_cawangan");
      
      res.json({
        status: "success",
        bookings: allBookings,
        commissionPercent: commissionPercent,
        monthlyCashOnHand: monthlyCashOnHand,
        reviews: [],
        branches: branchesData || [],
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

const MAKSIMUM_JARAK_METER = 500; // Staf wajib berada dalam lingkungan 500 meter dari kedai

// ==========================================
// Pangkalan In-Memory Mutex Lock (Menghalang Race Conditions / TOCTOU)
// ==========================================
const punchLocks = new Set();

// ==========================================
// 2. Rekod Kehadiran (Punch In / Punch Out) Dibaiki
// ==========================================
router.post(
  "/punch",
  authenticate,
  requireRole(["staff"]),
  async (req, res) => {
    // Kini menerima nilai latitud dan longitud dari peranti frontend
    // Juga menerima branch_id khas untuk General Staff
    const { type, location, lat: rawLat, lon: rawLon, branch_id: reqBranchId } = req.body;
    const staff_id = req.user.id;
    const username = req.user.username;
    const isGeneral = req.user.is_general;

    // [DIBAIKI] Semakan Geofencing ketat (Halang String Type-Juggling Bypass)
    const lat = parseFloat(rawLat);
    const lon = parseFloat(rawLon);
    
    if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
      return res.status(403).json({
        status: "error",
        message: "Koordinat GPS tidak sah. Lokasi wajib diaktifkan dan tepat.",
      });
    }

    // [DIBAIKI] Race Condition Lock untuk Punch In/Out
    const now = new Date();
    const myTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Waktu Malaysia
    const tarikh = myTime.toISOString().split("T")[0];
    const hari = myTime.toLocaleDateString("ms-MY", { weekday: "long" });
    const masa = myTime.toISOString().split("T")[1].substring(0, 8);

    const lockKey = `${staff_id}_${tarikh}_${type}`;
    if (punchLocks.has(lockKey)) {
      return res.status(409).json({ status: "error", message: "Rekod anda sedang diproses. Sila tunggu sebentar." });
    }
    punchLocks.add(lockKey);

    try {
      let targetBranchId = null;
      
      if (type === "CLOCK IN") {
        if (isGeneral) {
          if (!reqBranchId) {
             throw new Error("Sila pilih cawangan terlebih dahulu.");
          }
          targetBranchId = reqBranchId;
        } else {
          const { data: stData } = await supabase
            .from("staff")
            .select("branch_id")
            .eq("id", staff_id)
            .single();
          targetBranchId = stData ? stData.branch_id : null;
        }
      } else if (type === "CLOCK OUT") {
         // Untuk clock out, kita cari punch card hari ini untuk mengetahui cawangan mana
         const { data: existPunch } = await supabase
          .from("punch_cards")
          .select("id, cawangan")
          .eq("staff_id", staff_id)
          .eq("tarikh", tarikh)
          .single();
          
         if (!existPunch) {
            throw new Error("Anda belum Punch In hari ini.");
         }
         // Kita dapatkan branch_id berdasarkan nama cawangan (jika perlu)
         // Tetapi cara terbaik adalah mengambil cawangan terus.
         // Wait, to calculate distance, we need the branch's lat/lng. 
         const { data: brByName } = await supabase.from("branches").select("id, lat, lng").eq("nama_cawangan", existPunch.cawangan).single();
         if (brByName) targetBranchId = brByName.id;
      }

      // Geofencing Dynamic
      let namaCawangan = "Cawangan Utama";
      if (targetBranchId) {
        const { data: brData } = await supabase
          .from("branches")
          .select("nama_cawangan, lat, lng")
          .eq("id", targetBranchId)
          .single();
          
        if (brData) {
           namaCawangan = brData.nama_cawangan;
           const targetLat = parseFloat(brData.lat);
           const targetLng = parseFloat(brData.lng);
           
           if (!isNaN(targetLat) && !isNaN(targetLng) && targetLat !== 0) {
              const jarakDariKedai = hitungJarak(lat, lon, targetLat, targetLng);
              if (jarakDariKedai > MAKSIMUM_JARAK_METER) {
                throw new Error(`Anda berada ${(jarakDariKedai / 1000).toFixed(1)} km dari ${namaCawangan}. Tolong Punch di dalam kedai!`);
              }
           } else {
              // Cawangan tiada lat/lng disetkan, benarkan punch secara bebas
              console.log(`[INFO] Cawangan ${namaCawangan} tiada koordinat GPS. Geofencing dilangkau.`);
           }
        }
      }

      if (type === "CLOCK IN") {
        // [DIBAIKI] Semak jika staf sedang bercuti hari ini
        const { data: cutiHariIni } = await supabase
          .from("staff_leaves")
          .select("id")
          .eq("staff_id", staff_id)
          .eq("tarikh", tarikh)
          .single();
          
        if (cutiHariIni) {
           throw new Error("Anda sedang bercuti hari ini. Tidak dibenarkan Punch In.");
        }

        const { data: existPunch } = await supabase.from("punch_cards").select("id").eq("staff_id", staff_id).eq("tarikh", tarikh).single();
        if (existPunch) {
          throw new Error("Anda sudah Punch In hari ini.");
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
        const { data: existPunch } = await supabase
          .from("punch_cards")
          .select("id")
          .eq("staff_id", staff_id)
          .eq("tarikh", tarikh)
          .single();

        if (!existPunch) {
          return res.status(400).json({ status: "error", message: "Anda belum Punch In hari ini." });
        }

        const { error } = await supabase
          .from("punch_cards")
          .update({
            clock_out: masa,
            lokasi: location,
          })
          .eq("id", existPunch.id);

        if (error) throw error;
      }

      punchLocks.delete(lockKey);
      res.json({ status: "success", message: `Berjaya ${type} pada ${masa}.` });
    } catch (err) {
      if (typeof lockKey !== "undefined") punchLocks.delete(lockKey);
      console.error("Ralat Rekod Kehadiran:", err);
      res.status(500).json({ status: "error", message: "Ralat sistem. Cuba sebentar lagi." });
    }
  },
);

// ==========================================
// 3. Pengurusan Cuti Staf (Leave Management)
// ==========================================
router.get("/leaves", authenticate, requireRole(["staff"]), async (req, res) => {
  const staff_id = req.user.id;
  try {
    const { data: stData } = await supabase.from("staff").select("branch_id").eq("id", staff_id).single();
    const branch_id = stData ? stData.branch_id : null;

    if (!branch_id) {
      return res.json({ status: "success", leaves: [] });
    }

    const { data: leaves } = await supabase
      .from("staff_leaves")
      .select("tarikh")
      .eq("branch_id", branch_id)
      .neq("staff_id", staff_id);

    res.json({ status: "success", leaves: leaves || [] });
  } catch (err) {
    console.error("Ralat /leaves:", err);
    res.status(500).json({ status: "error", message: "Gagal memuatkan data cuti." });
  }
});

router.get("/my-leaves", authenticate, requireRole(["staff"]), async (req, res) => {
  try {
    const { data: leaves } = await supabase
      .from("staff_leaves")
      .select("tarikh")
      .eq("staff_id", req.user.id);
    res.json({ status: "success", leaves: leaves || [] });
  } catch (err) {
    console.error("Ralat /my-leaves:", err);
    res.status(500).json({ status: "error", message: "Gagal memuatkan cuti anda." });
  }
});

router.post("/leaves", authenticate, requireRole(["staff"]), async (req, res) => {
  const staff_id = req.user.id;
  const { dates } = req.body; 
  
  if (!Array.isArray(dates) || dates.length !== 4) {
    return res.status(400).json({ status: "error", message: "Anda mesti memilih tepat 4 hari cuti." });
  }

  try {
    const { data: stData } = await supabase.from("staff").select("branch_id").eq("id", staff_id).single();
    const branch_id = stData ? stData.branch_id : null;

    const now = new Date();
    const myTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const nextMonth = myTime.getMonth() === 11 ? 0 : myTime.getMonth() + 1;
    const nextMonthYear = myTime.getMonth() === 11 ? myTime.getFullYear() + 1 : myTime.getFullYear();
    const firstDayNextMonth = new Date(nextMonthYear, nextMonth, 1).toISOString().split('T')[0];
    const firstDayTwoMonths = new Date(nextMonthYear, nextMonth + 1, 1).toISOString().split('T')[0];

    // Padam cuti bulan hadapan staf ini (untuk override)
    await supabase.from("staff_leaves")
      .delete()
      .eq("staff_id", staff_id)
      .gte("tarikh", firstDayNextMonth)
      .lt("tarikh", firstDayTwoMonths);

    if (branch_id) {
       const { data: taken } = await supabase
        .from("staff_leaves")
        .select("tarikh")
        .eq("branch_id", branch_id)
        .in("tarikh", dates);
        
       if (taken && taken.length > 0) {
         return res.status(400).json({ status: "error", message: `Tarikh ${taken[0].tarikh} telah diambil oleh staf lain di cawangan anda.` });
       }
    }

    const inserts = dates.map(d => ({
      staff_id: staff_id,
      branch_id: branch_id,
      tarikh: d
    }));

    const { error } = await supabase.from("staff_leaves").insert(inserts);
    if (error) {
      if (error.code === '23505') { 
        return res.status(400).json({ status: "error", message: "Tarikh bertindih dengan staf lain di cawangan anda." });
      }
      throw error;
    }

    res.json({ status: "success", message: "Cuti bulan hadapan berjaya disimpan!" });
  } catch (err) {
    console.error("Ralat post /leaves:", err);
    res.status(500).json({ status: "error", message: "Gagal menyimpan cuti." });
  }
});

module.exports = router;
