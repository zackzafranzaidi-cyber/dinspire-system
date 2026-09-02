const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const crypto = require("crypto");
const cache = require("../utils/cache");
const schedule = require("node-schedule");
const { sendSMS } = require("../utils/sms");
const { notifyOwner, notifyStaff } = require("../utils/push");

// ==========================================
// [DIBAIKI] Fungsi Keselamatan: Semak Magic Number Fail (Bukan sekadar Regex)
// ==========================================
function isValidImageBuffer(buffer) {
  // Baca 4 byte pertama dari buffer untuk mendapatkan tandatangan Hex
  const hex = buffer.toString("hex", 0, 4).toUpperCase();

  if (hex.startsWith("FFD8FF")) return "jpg"; // JPEG/JPG
  if (hex === "89504E47") return "png"; // PNG
  if (hex.startsWith("47494638")) return "gif"; // GIF
  if (
    hex.startsWith("52494646") &&
    buffer.toString("hex", 8, 12).toUpperCase() === "57454250"
  )
    return "webp"; // WEBP

  // Amaran: Ini hanyalah semakan tandatangan asas.
  // Dalam persekitaran berskala besar, gunakan modul seperti 'file-type' dan virus scanner.
  return null; // Fail palsu / virus
}

async function isStaffPunchedIn(staff_id) {
  if (!staff_id) return false;
  const now = new Date();
  const myTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const tarikhStr = myTime.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("punch_cards")
    .select("id")
    .eq("staff_id", staff_id)
    
    .is("waktu_out", null);

  if (error || !data || data.length === 0) return false;
  return true;
}

async function uploadReceiptToStorage(base64Image, orderNo) {
  if (!base64Image || !base64Image.startsWith("data:image")) return base64Image;
  
  // [DIBAIKI] Pembekuan Teras Pemproses (Regex DoS)
  if (base64Image.length > 5000000) {
    console.error("Resit terlalu besar (Melebihi 5MB).");
    return null;
  }

  try {
    const matches = base64Image.match(
      /^data:image\/([A-Za-z-+\/]+);base64,(.+)$/,
    );
    if (!matches || matches.length !== 3) return base64Image;

    const buffer = Buffer.from(matches[2], "base64");

    // [DIBAIKI] Halang skrip hasad (malware)
    const realExtension = isValidImageBuffer(buffer);
    if (!realExtension) {
      throw new Error(
        "Fail tidak sah. Percubaan memuat naik fail berbahaya disekat!",
      );
    }

    const fileName = `receipt_${crypto.randomUUID()}.${realExtension}`;

    const { data, error } = await supabase.storage
      .from("receipts")
      .upload(fileName, buffer, {
        contentType: `image/${realExtension}`,
        upsert: true,
      });
    if (error) return null;

    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Ralat Muat Naik Resit:", err.message);
    return null;
  }
}

const toyyibpay = require("../utils/toyyibpay");

// ==========================================
// Pangkalan In-Memory Mutex Lock (Anti Race Condition / TOCTOU)
// ==========================================
const bookingLocks = new Set();
const oncallLocks = new Set();
const reviewLocks = new Set(); // [DIBAIKI] Mengelak klon Ulasan 1 Bintang (Review Race Condition)
const completionLocks = new Set(); // [DIBAIKI] Mengelak Race Condition semasa penyiapan pesanan

// ==========================================
// [FUNGSI BAHARU] Semak Ketersediaan Staf (Cuti & Tempahan Aktif)
// ==========================================
router.get("/staff-availability", async (req, res) => {
  const { staff_id } = req.query;
  if (!staff_id) return res.json({ status: "success", leaves: [], bookings: [] });

  try {
    // 1. Dapatkan tarikh cuti
    const { data: leaveData } = await supabase
      .from("staff_leaves")
      .select("tarikh")
      .eq("staff_id", staff_id);
      
    const leaves = leaveData ? leaveData.map(d => d.tarikh) : [];

    // 2. Dapatkan tempahan aktif dari ketiga-tiga jadual
    const [bReq, tReq, oReq] = await Promise.all([
      supabase.from("booking_records").select("tarikh, masa").eq("staff_id", staff_id).in("status", ["Belum", "Selesai", "Pending Verification"]),
      supabase.from("treatment_records").select("tarikh, masa").eq("staff_id", staff_id).in("status", ["Belum", "Selesai", "Pending Verification"]),
      supabase.from("oncall_records").select("tarikh, masa").eq("barber", staff_id).in("status", ["Belum", "Selesai", "Pending Verification"])
    ]);

    const activeBookings = [];
    if (bReq.data) activeBookings.push(...bReq.data);
    if (tReq.data) activeBookings.push(...tReq.data);
    if (oReq.data) activeBookings.push(...oReq.data);
    
    // Tapis tempahan yang valid sahaja
    const bookings = activeBookings.filter(b => b.tarikh && b.masa);

    res.json({ status: "success", leaves, bookings });
  } catch (err) {
    console.error("Ralat /staff-availability:", err);
    res.json({ status: "error", leaves: [], bookings: [] });
  }
});

// ==========================================
// 1. Pelanggan Buat Tempahan (Booking)
// ==========================================
router.post("/", authenticate, requireRole(["customer"]), async (req, res) => {
  const {
    booking_type,
    service_id,
    staff_id,
    branch_id,
    booking_date,
    booking_time,
    receipt_url,
  } = req.body;
  const customer_id = req.user.id;
  let lockKey;

  try {
    const { data: cust, error: custError } = await supabase
      .from("customers")
      .select("name, phone")
      .eq("id", customer_id)
      .maybeSingle();
    if (!cust)
      return res
        .status(401)
        .json({ status: "error", message: "BOOKINGS_NO_CUST: Sesi anda telah tamat atau tidak wujud. Sila log masuk semula." });

    const { data: setSvc } = await supabase
      .from("settings")
      .select("setting_value")
      .eq("setting_key", "service_fee")
      .maybeSingle();
    let serviceFee = setSvc ? parseFloat(setSvc.setting_value) : 0;

    let harga_rm = 0.0;
    let order_no = "";

    if (booking_type === "treatment") {
      const { data: svc } = await supabase
        .from("treatments")
        .select("harga")
        .eq("id", service_id)
        .maybeSingle();
      if (!svc) return res.status(400).json({ status: "error", message: "Servis tidak dijumpai." });
      harga_rm = parseFloat(svc.harga);
      order_no = "TR" + crypto.randomUUID().split("-")[0].toUpperCase();
    } else {
      const { data: svc } = await supabase
        .from("haircuts")
        .select("harga")
        .eq("id", service_id)
        .maybeSingle();
      if (!svc) return res.status(400).json({ status: "error", message: "Servis tidak dijumpai." });
      harga_rm = parseFloat(svc.harga);
      order_no = "DB" + crypto.randomUUID().split("-")[0].toUpperCase();
    }

    // [DIBAIKI] Halang Time-Machine (Tempahan masa lepas)
    const bookingDateTime = new Date(`${booking_date}T${booking_time}+08:00`);
    if (bookingDateTime < new Date()) {
      return res.status(400).json({ status: "error", message: "Tarikh atau masa tempahan telah berlalu." });
    }

    // [DIBAIKI] Race Condition Lock
    lockKey = `${staff_id}_${booking_date}_${booking_time}`;
    if (bookingLocks.has(lockKey)) {
      return res.status(409).json({ status: "error", message: "Maaf, slot ini sedang diproses untuk pelanggan lain." });
    }
    bookingLocks.add(lockKey);

    // [DIBAIKI] Semak jika staf sedang bercuti pada tarikh ini
    const { data: cutiStaf } = await supabase
      .from("staff_leaves")
      .select("id")
      .eq("staff_id", staff_id)
      .eq("tarikh", booking_date)
      .maybeSingle();
      
    if (cutiStaf) {
      if (bookingLocks.has(lockKey)) bookingLocks.delete(lockKey);
      return res.status(400).json({ status: "error", message: "Maaf, Barber yang dipilih sedang bercuti pada tarikh tersebut." });
    }

    // [DIBAIKI] Perlindungan Double Booking Peringkat Aplikasi
    const { data: existBook } = await supabase
      .from("booking_records")
      .select("no_booking")
      .eq("staff_id", staff_id)
      .eq("tarikh", booking_date)
      .eq("masa", booking_time)
      .in("status", ["Belum", "Selesai"]);
    const { data: existTreat } = await supabase
      .from("treatment_records")
      .select("no_booking")
      .eq("staff_id", staff_id)
      .eq("tarikh", booking_date)
      .eq("masa", booking_time)
      .in("status", ["Belum", "Selesai"]);

    if (
      (existBook && existBook.length > 0) ||
      (existTreat && existTreat.length > 0)
    ) {
      bookingLocks.delete(lockKey);
      return res
        .status(409)
        .json({
          status: "error",
          message: "Maaf, slot ini baru sahaja ditempah oleh pelanggan lain.",
        });
    }

    const payment_method = req.body.payment_method || "fpx";



    let fpxResult;
    let finalReceiptUrl = "";
    
    if (payment_method === "qr") {
      if (!receipt_url) {
        if (typeof lockKey !== 'undefined') bookingLocks.delete(lockKey);
        return res.status(400).json({ status: "error", message: "Resit pembayaran QR diperlukan." });
      }
      finalReceiptUrl = await uploadReceiptToStorage(receipt_url, order_no);
    } else {
      // FPX Payment Generation
      const total_amount = harga_rm + serviceFee;
      const protocol = req.protocol === 'http' ? 'https' : req.protocol; // enforce https for production callback
      const host = req.get('host');
      const originUrl = req.headers.origin || `${protocol}://${host}`;
      const returnUrl = `${originUrl}/?fpx=return`;
      const callbackUrl = `${protocol}://${host}/api/bookings/webhook/fpx`;
      
      try {
      fpxResult = await toyyibpay.createPayment(
        total_amount,
        order_no,
        `Bayaran Servis Dinspire: ${order_no}`,
        cust.email || "tiada@email.com",
        cust.name,
        returnUrl,
        callbackUrl
      );
    } catch (err) {
      return res.status(502).json({
         status: "error",
         message: err.message || "Gagal berhubung dengan gateway FPX"
      });
    }
    }

    const basePayload = {
      no_booking: order_no,
      customer_id: customer_id,
      nama_pelanggan: cust.name,
      no_phone: cust.phone,
      tarikh: booking_date,
      masa: booking_time,
      staff_id: staff_id,
      harga_rm: harga_rm,
      service_fee: serviceFee,
      resit: payment_method === "qr" ? finalReceiptUrl : `FPX_PENDING:${fpxResult.transaction_id}`,
      status: payment_method === "qr" ? "Pending Verification" : "Belum", // [DIBAIKI] Status manual
    };

    if (booking_type === "treatment") {
      basePayload.jenis_rawatan = service_id;
      // [DIBAIKI] Buang rekod 'Batal' yang lama pada slot ini untuk elak 409 Unique Constraint DB
      await supabase.from("treatment_records").delete().match({ staff_id, tarikh: booking_date, masa: booking_time, status: 'Batal' });
      const { error } = await supabase
        .from("treatment_records")
        .insert([basePayload]);
      if (error) throw error;
    } else {
      basePayload.jenis_haircut = service_id;
      // [DIBAIKI] Buang rekod 'Batal' yang lama pada slot ini untuk elak 409 Unique Constraint DB
      await supabase.from("booking_records").delete().match({ staff_id, tarikh: booking_date, masa: booking_time, status: 'Batal' });
      const { error } = await supabase
        .from("booking_records")
        .insert([basePayload]);
      if (error) throw error;
    }

    notifyOwner("Tempahan Baharu!", `Satu tempahan ${booking_type === "treatment" ? "rawatan" : "guntingan"} diterima pada ${booking_date} ${booking_time} (No Bil: ${order_no})`);
    notifyStaff(staff_id, "Tempahan Baharu!", `Anda mendapat tempahan pelanggan pada ${booking_date} ${booking_time}`);

    bookingLocks.delete(lockKey); // [DIBAIKI] MEMORY LEAK FIX
    if (payment_method === "qr") {
      res.json({ 
        status: "success", 
        message: "Tempahan berjaya", 
        order_no,
      });
    } else {
      res.json({ 
        status: "success", 
        message: "Pembayaran sedang diproses", 
        order_no,
        payment_url: fpxResult.payment_url 
      });
    }
  } catch (error) {
    console.error("Ralat /bookings POST:", error);
    if (typeof lockKey !== 'undefined') bookingLocks.delete(lockKey); // [DIBAIKI] MEMORY LEAK FIX
    if (error.code === '23505') {
      return res.status(409).json({ status: "error", message: "Maaf, slot ini baru sahaja ditempah oleh pelanggan lain pada saat yang sama (Tindanan berlaku)." });
    }
    res
      .status(500)
      .json({ status: "error", message: "Ralat pelayan memproses tempahan: " + (error.message || error.toString()) });
  }
});

// ==========================================
// 2. Staf Tandakan Booking Selesai
// ==========================================
router.put(
  "/order/:orderNo/complete",
  authenticate,
  requireRole(["staff", "owner"]),
  async (req, res) => {
    let { orderNo } = req.params;
    orderNo = String(orderNo || "");
    const { final_price, receipt_url, jenis_bayaran } = req.body;

    const parsedPrice = parseFloat(final_price);
    if (isNaN(parsedPrice) || parsedPrice < 0)
      return res
        .status(400)
        .json({ status: "error", message: "Harga tidak sah!" });

    if (req.user.role === "staff") {
       const punchedIn = await isStaffPunchedIn(req.user.id);
       if (!punchedIn) {
          return res.status(403).json({ status: "error", message: "Anda mesti Punch-In dahulu sebelum menguruskan jualan!" });
       }
    }

    // [DIBAIKI] Pengklonan Butang Selesai (Race Condition)
    if (completionLocks.has(orderNo)) {
      return res.status(409).json({ status: "error", message: "Pesanan ini sedang diselesaikan." });
    }
    completionLocks.add(orderNo);

    let finalReceiptUrl = await uploadReceiptToStorage(receipt_url, orderNo);

    try {
      let tableName = "booking_records";
      if (orderNo.startsWith("TR")) tableName = "treatment_records";
      else if (orderNo.startsWith("DBC")) tableName = "oncall_records";

      // Fetch the booking data to get time and service_fee
      const { data: bData } = await supabase.from(tableName).select("tarikh, masa, service_fee").eq("no_booking", orderNo).maybeSingle();

      // [DIBAIKI] Time-Check: Selesai hanya boleh ditekan selepas masa berlalu
      if (tableName !== "oncall_records") { // walkin tiada masa depan, oncall bergantung
        if (bData && bData.tarikh && bData.masa) {
          const bookingDateTime = new Date(`${bData.tarikh}T${bData.masa}+08:00`);
          if (bookingDateTime > new Date()) {
            completionLocks.delete(orderNo);
            return res.status(400).json({ status: "error", message: "Servis belum tamat. Anda hanya boleh klik 'Selesai' selepas masa tempahan berlalu." });
          }
        }
      }

      // Campurkan yuran booking ke dalam harga servis akhir (atas permintaan pengguna)
      let existingServiceFee = bData ? parseFloat(bData.service_fee || 0) : 0;
      let finalTotalHarga = parsedPrice + existingServiceFee;

      let payload = { status: "Selesai", harga_rm: finalTotalHarga };
      if (finalReceiptUrl) payload.resit_selesai = finalReceiptUrl;

      let query = supabase
        .from(tableName)
        .update(payload)
        .eq("no_booking", orderNo);
      
      if (req.user.role === "staff") query = query.eq("staff_id", req.user.id);

      const { error } = await query;
      if (error) throw error;

      completionLocks.delete(orderNo);
      res.json({ status: "success", message: "Servis disahkan selesai" });
    } catch (error) {
      if (typeof orderNo !== "undefined") completionLocks.delete(orderNo);
      res.status(500).json({ status: "error", message: "Ralat pelayan." });
    }
  },
);

// ==========================================
// 2.5. Staf Batal Tempahan
// ==========================================
router.put(
  "/order/:orderNo/cancel",
  authenticate,
  requireRole(["staff", "owner", "admin"]),
  async (req, res) => {
    let { orderNo } = req.params;
    orderNo = String(orderNo || "");
    try {
      let tableName = "booking_records";
      if (orderNo.startsWith("TR")) tableName = "treatment_records";
      else if (orderNo.startsWith("DBC")) tableName = "oncall_records";

      let cancelledBy = req.user.role === "staff" ? "staff" : "admin";
      let query = supabase
        .from(tableName)
        .update({ status: "Batal", cancelled_by: cancelledBy })
        .eq("no_booking", orderNo);
      
      // Staff hanya boleh batal tempahan mereka sendiri
      if (req.user.role === "staff") query = query.eq("staff_id", req.user.id);

      const { error } = await query;
      if (error) throw error;

      res.json({ status: "success", message: "Tempahan telah dibatalkan." });
    } catch (error) {
      console.error("Cancel Error:", error);
      res.status(500).json({ status: "error", message: "Ralat pelayan." });
    }
  }
);

// ==========================================
// 2.6. Pelanggan Reset Tempahan (Selepas Dibatalkan Admin)
// ==========================================
router.put(
  "/order/:orderNo/reset",
  authenticate,
  requireRole(["customer"]),
  async (req, res) => {
    const { orderNo } = req.params;
    const { new_date, new_time, new_staff_id } = req.body;

    if (!new_date || !new_time || !new_staff_id) {
      return res.status(400).json({ status: "error", message: "Tarikh, masa, dan staf baharu diperlukan." });
    }

    try {
      let tableName = "booking_records";
      if (orderNo.startsWith("TR")) tableName = "treatment_records";
      else if (orderNo.startsWith("DBC")) tableName = "oncall_records";

      // Semak jika booking wujud, status Batal, dan dibatalkan oleh admin
      const { data: bData } = await supabase.from(tableName).select("*").eq("no_booking", orderNo).eq("customer_id", req.user.id).single();
      
      if (!bData) {
        return res.status(404).json({ status: "error", message: "Tempahan tidak dijumpai." });
      }
      if (bData.status !== "Batal" || bData.cancelled_by !== "admin") {
        return res.status(403).json({ status: "error", message: "Anda tidak dibenarkan reset tempahan ini." });
      }

      // Pastikan slot baru kosong
      const { data: existB } = await supabase.from("booking_records").select("no_booking").eq("staff_id", new_staff_id).eq("tarikh", new_date).eq("masa", new_time).in("status", ["Belum", "Selesai"]);
      const { data: existT } = await supabase.from("treatment_records").select("no_booking").eq("no_booking").eq("staff_id", new_staff_id).eq("tarikh", new_date).eq("masa", new_time).in("status", ["Belum", "Selesai"]);
      const { data: existO } = await supabase.from("oncall_records").select("no_booking").eq("staff_id", new_staff_id).eq("tarikh", new_date).eq("masa", new_time).in("status", ["Belum", "Selesai"]);

      if ((existB && existB.length > 0) || (existT && existT.length > 0) || (existO && existO.length > 0)) {
        return res.status(409).json({ status: "error", message: "Slot telah ditempah. Sila pilih masa atau barber lain." });
      }

      // Update rekod kepada Belum
      const { error } = await supabase.from(tableName).update({
        tarikh: new_date,
        masa: new_time,
        staff_id: new_staff_id,
        status: "Belum",
        cancelled_by: null
      }).eq("no_booking", orderNo);

      if (error) throw error;

      res.json({ status: "success", message: "Tempahan anda berjaya dikemas kini dan diaktifkan semula!" });
    } catch (error) {
      console.error("Reset Error:", error);
      res.status(500).json({ status: "error", message: "Ralat pelayan semasa reset." });
    }
  }
);

// ==========================================
// 3. Staf Daftar Walk-in
// ==========================================
router.post(
  "/walkin",
  authenticate,
  requireRole(["staff", "owner"]),
  async (req, res) => {
    const {
      customer_name,
      no_phone,
      service_id,
      booking_date,
      booking_time,
      payment_method,
      receipt_url,
      price,
    } = req.body;
      const staff_id = req.user.id;
      
      if (req.user.role === "staff") {
         const punchedIn = await isStaffPunchedIn(req.user.id);
         if (!punchedIn) {
            return res.status(403).json({ status: "error", message: "Anda mesti Punch-In dahulu sebelum mendaftar pelanggan Walk-In!" });
         }
      }
        
      // [DIBAIKI] Lompang Rentas Masa Walk-in (Zon Masa Malaysia)
      const now = new Date();
      const myTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const todayStr = myTime.toISOString().split("T")[0];
      if (booking_date < todayStr) {
        return res.status(400).json({ status: "error", message: "Tarikh Walk-in tidak boleh menggunakan tarikh semalam." });
      }

      // [DIBAIKI] Server-Side Price Trust (dengan pengecualian Harga 0)
      let hargaSebenar = parseFloat(price) || 0.0; 
      const { data: svcData } = await supabase.from("haircuts").select("harga").eq("id", service_id).maybeSingle();
      if (svcData) {
        let dbPrice = parseFloat(svcData.harga) || 0;
        if (dbPrice > 0) {
          hargaSebenar = dbPrice; // Paksa harga dari DB jika ia lebih dari 0
        }
      }
      
      const parsedPrice = hargaSebenar;

      const receiptName = "WLK" + crypto.randomUUID().split("-")[0].toUpperCase();
    let finalReceiptUrl = await uploadReceiptToStorage(
      receipt_url,
      receiptName,
    );

    try {
      const { error } = await supabase.from("walkin_records").insert([
        {
          nama_pelanggan: customer_name,
          no_phone: no_phone || "-",
          tarikh: booking_date,
          masa: booking_time,
          jenis_potongan: service_id,
          staff_id: staff_id,
          harga_rm: parsedPrice,
          service_fee: 0,
          jenis_bayaran: payment_method,
          resit: finalReceiptUrl,
        },
      ]);
      if (error) throw error;
      notifyOwner("Walk-In Baharu!", `Pelanggan walk-in (${customer_name}) telah didaftarkan.`);
      res.json({ status: "success", message: "Rekod Walk-In disimpan" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ralat pelayan." });
    }
  },
);

// ==========================================
// 4. Pelanggan Mendaftar On-Call Service
// ==========================================
router.post(
  "/oncall",
  authenticate,
  requireRole(["customer"]),
  async (req, res) => {
    const { address, date, time, service_id, barber, receipt_url } = req.body;
    const customer_id = req.user.id;
    let lockKey;

    try {
      const { data: cust, error: custError } = await supabase
        .from("customers")
        .select("name, phone")
        .eq("id", customer_id)
        .maybeSingle();
      if (!cust)
        return res
          .status(401)
          .json({ status: "error", message: "ONCALL_NO_CUST: Pelanggan tidak dijumpai." });

      // [DIBAIKI] Halang Time-Travel
      const bookingDateTime = new Date(`${date}T${time}+08:00`);
      if (bookingDateTime < new Date()) {
        return res.status(400).json({ status: "error", message: "Tarikh atau masa tempahan telah berlalu." });
      }

      // [DIBAIKI] Race Condition Lock OnCall
      lockKey = `${barber}_${date}_${time}`;
      if (oncallLocks.has(lockKey)) {
        return res.status(409).json({ status: "error", message: "Slot On-Call ini sedang diproses." });
      }
      oncallLocks.add(lockKey);

      // [DIBAIKI] Semak jika staf sedang bercuti pada tarikh ini
      const { data: cutiStaf } = await supabase
        .from("staff_leaves")
        .select("id")
        .eq("staff_id", barber)
        .eq("tarikh", date)
        .maybeSingle();
        
      if (cutiStaf) {
        if (oncallLocks.has(lockKey)) oncallLocks.delete(lockKey);
        return res.status(400).json({ status: "error", message: "Maaf, Barber yang dipilih sedang bercuti pada tarikh tersebut." });
      }

      const { data: setSvc } = await supabase
        .from("settings")
        .select("setting_value")
        .eq("setting_key", "service_fee")
        .maybeSingle();
      let serviceFee = setSvc ? parseFloat(setSvc.setting_value) : 0;

      let harga_rm = 0.0;
      const { data: svc } = await supabase
        .from("haircuts")
        .select("harga")
        .eq("id", service_id)
        .maybeSingle();
      if (!svc) return res.status(400).json({ status: "error", message: "Servis tidak dijumpai." });
      harga_rm = parseFloat(svc.harga);

      const order_no = "DBC" + crypto.randomUUID().split("-")[0].toUpperCase();
      
      const payment_method = req.body.payment_method || "fpx";

      let fpxResult;
      let finalReceiptUrl = "";
      
      if (payment_method === "qr") {
        if (!receipt_url) {
          return res.status(400).json({ status: "error", message: "Resit pembayaran QR diperlukan." });
        }
        finalReceiptUrl = await uploadReceiptToStorage(receipt_url, order_no);
      } else {
        // FPX Payment Generation
        const total_amount = harga_rm + serviceFee;
        const protocol = req.protocol === 'http' ? 'https' : req.protocol;
        const host = req.get('host');
        const originUrl = req.headers.origin || `${protocol}://${host}`;
        const returnUrl = `${originUrl}/?fpx=return`;
        const callbackUrl = `${protocol}://${host}/api/bookings/webhook/fpx`;
        
        try {
        fpxResult = await toyyibpay.createPayment(
          total_amount,
          order_no,
          `Bayaran On-Call: ${order_no}`,
          cust.email || "tiada@email.com",
          cust.name,
          returnUrl,
          callbackUrl
        );
      } catch (err) {
        return res.status(502).json({
           status: "error",
           message: err.message || "Gagal berhubung dengan gateway FPX"
        });
      }
      }

      // [DIBAIKI] Buang rekod 'Batal' yang lama pada slot ini untuk elak 409 Unique Constraint DB
      await supabase.from("oncall_records").delete().match({ staff_id: barber, tarikh: date, masa: time, status: 'Batal' });
      const { error } = await supabase.from("oncall_records").insert([
        {
          no_booking: order_no,
          customer_id: customer_id,
          nama_pelanggan: cust.name,
          tarikh: date,
          masa: time,
          lokasi: address,
          jenis_haircut: service_id,
          staff_id: barber,
          harga_rm: harga_rm,
          service_fee: serviceFee,
          resit: payment_method === "qr" ? finalReceiptUrl : `FPX_PENDING:${fpxResult.transaction_id}`,
          status: "Belum",
        },
      ]);

      if (error) throw error;
      
      notifyOwner("Tempahan On-Call!", `Satu tempahan On-Call diterima dari ${cust.name}.`);
      notifyStaff(barber, "Tempahan On-Call!", `Anda mendapat tugasan On-Call dari ${cust.name} di lokasi ${address}`);

      try {
        // [DIBAIKI] Zon Masa Peringatan
        const bookingDateTime = new Date(`${date}T${time}+08:00`);
        const reminderTime = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
        if (reminderTime > new Date()) {
          schedule.scheduleJob(reminderTime, async function() {
            const oncallMsg = `Dinspire Barbershop - Hai ${cust.name}, Peringatan! Sila bersedia di lokasi anda, Barber On-Call anda akan tiba dalam masa 2 jam.`;
            await sendSMS(cust.phone, oncallMsg, false);
          });
        }
      } catch (e) {
        console.error("Gagal menetapkan jadual peringatan SMS On-Call:", e);
      }
      if (payment_method === "qr") {
        res.json({
          status: "success",
          message: "Tempahan On-Call berjaya",
          order_no,
        });
      } else {
        res.json({
          status: "success",
          message: "Pembayaran On-Call sedang diproses",
          order_no,
          payment_url: fpxResult.payment_url
        });
      }
      oncallLocks.delete(lockKey);
    } catch (error) {
      if (typeof lockKey !== "undefined") oncallLocks.delete(lockKey);
      console.error(error);
      return res.status(500).json({ status: "error", message: "Gagal memproses tempahan." });
    }
  },
);

// ==========================================
// 5. [DIBAIKI] Pelanggan Beli Produk (Elak Price Tampering)
// ==========================================
router.post(
  "/products",
  authenticate,
  requireRole(["customer"]),
  async (req, res) => {
    // ABAIKAN parameter total_price dari frontend untuk keselamatan
    const { cart_items, address, receipt_url } = req.body;
    const customer_id = req.user.id;

    try {
      const { data: setShip } = await supabase
        .from("settings")
        .select("setting_value")
        .eq("setting_key", "shipping_fee")
        .maybeSingle();
      let shippingFee = setShip ? parseFloat(setShip.setting_value) : 0;

      const { data: cust, error: custError } = await supabase
        .from("customers")
        .select("name, phone")
        .eq("id", customer_id)
        .maybeSingle();
      if (!cust)
        return res
          .status(401)
          .json({ status: "error", message: "PRODUCTS_NO_CUST: Sesi anda tamat." });

      // AMBIL HARGA SEBENAR DARI PANGKALAN DATA SUPABASE
      const itemIds = Object.keys(cart_items || {});
      if (itemIds.length === 0)
        return res
          .status(400)
          .json({ status: "error", message: "Troli kosong." });

      // [DIBAIKI] Halang Massive Array DoS (Bom Troli)
      if (itemIds.length > 50)
        return res
          .status(400)
          .json({ status: "error", message: "Troli melebihi had (Maks: 50 jenis)." });

      const { data: productsDB } = await supabase
        .from("products")
        .select("id, nama, harga, stok")
        .in("id", itemIds);
      if (!productsDB || productsDB.length === 0)
        return res
          .status(400)
          .json({ status: "error", message: "Produk tidak sah." });

      let trustedCartItems = {};
      let totalProductsPrice = 0;

      // Membina semula troli menggunakan data yang DITENTUSAHKAN oleh pangkalan data
      for (let id of itemIds) {
        let dbProduct = productsDB.find((p) => p.id == id);
        if (dbProduct) {
          let currentStock = parseInt(dbProduct.stok) || 0;
          let qty = Math.max(1, Math.min(100, parseInt(cart_items[id].qty) || 1));
          
          if (qty > currentStock) {
              return res.status(400).json({ status: "error", message: `Maaf, stok untuk ${dbProduct.nama} tidak mencukupi (Tinggal ${currentStock}).` });
          }
          
          trustedCartItems[id] = {
            id: dbProduct.id,
            name: dbProduct.nama, // Guna nama dari DB (Bukan dari pelayar)
            price: parseFloat(dbProduct.harga), // GUNA HARGA SEBENAR DARI DB!
            qty: qty,
            imgUrl: cart_items[id].imgUrl,
          };
          totalProductsPrice += parseFloat(dbProduct.harga) * qty;
        }
      }
      
      // POTONG STOK SEKARANG (Reserve Inventory)
      for (let id in trustedCartItems) {
         let p = trustedCartItems[id];
         let dbProduct = productsDB.find((prod) => prod.id == id);
         let newStock = Math.max(0, (parseInt(dbProduct.stok) || 0) - p.qty);
         await supabase.from("products").update({ stok: newStock }).eq("id", id);
      }

      const order_uuid = crypto.randomUUID();
      const receipt_name = "PRD-" + order_uuid;
      
      const payment_method = req.body.payment_method || "fpx";



      let fpxResult;
      let finalReceiptUrl = "";
      
      if (payment_method === "qr") {
        if (!receipt_url) {
          return res.status(400).json({ status: "error", message: "Resit pembayaran QR diperlukan." });
        }
        finalReceiptUrl = await uploadReceiptToStorage(receipt_url, receipt_name);
      } else {
        // FPX Payment Generation
        const total_amount = totalProductsPrice + shippingFee;
        const protocol = req.protocol === 'http' ? 'https' : req.protocol;
        const host = req.get('host');
        const originUrl = req.headers.origin || `${protocol}://${host}`;
        const returnUrl = `${originUrl}/?fpx=return`;
        const callbackUrl = `${protocol}://${host}/api/bookings/webhook/fpx`;
        
        try {
        fpxResult = await toyyibpay.createPayment(
          total_amount,
          receipt_name,
          `Pembelian Produk: ${receipt_name}`,
          cust.email || "tiada@email.com",
          cust.name,
          returnUrl,
          callbackUrl
        );
      } catch (err) {
        return res.status(502).json({
           status: "error",
           message: err.message || "Gagal berhubung dengan gateway FPX"
        });
      }
      }

      const { error } = await supabase.from("product_orders").insert([
        {
          id: order_uuid,
          customer_id: customer_id,
          nama_pembeli: cust.name,
          senarai_produk: JSON.stringify(trustedCartItems), // Simpan data yang telah disucikan
          lokasi_penghantaran: address,
          resit: payment_method === "qr" ? finalReceiptUrl : `FPX_PENDING:${fpxResult.transaction_id}`,
          shipping_fee: shippingFee,
          status: payment_method === "qr" ? "Pending Verification" : "Preparing", // [DIBAIKI] Status manual
        },
      ]);

      if (error) throw error;
      
      notifyOwner("Pesanan Produk!", `Satu pesanan E-Commerce baru diterima dari ${cust.name}.`);

      if (payment_method === "qr") {
        res.json({
          status: "success",
          message: "Pesanan produk berjaya dihantar!",
        });
      } else {
        res.json({
          status: "success",
          message: "Pembayaran produk sedang diproses",
          payment_url: fpxResult.payment_url
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: "error", message: "Gagal memproses belian." });
    }
  },
);

router.get(
  "/my-orders",
  authenticate,
  requireRole(["customer"]),
  async (req, res) => {
    try {
      const { data: cust } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("id", req.user.id)
        .maybeSingle();
      if (!cust)
        return res.json({ status: "error", message: "Akaun tidak dijumpai" });

      const [
        { data: prodOrders },
        { data: bookOrders },
        { data: treatOrders },
        { data: oncallOrders }
      ] = await Promise.all([
        supabase.from("product_orders").select("id, senarai_produk, status, tracking_no, created_at").eq("customer_id", req.user.id),
        supabase.from("booking_records").select("no_booking, tarikh, masa, status, cancelled_by, created_at, staff_id, haircuts(nama_potongan)").eq("customer_id", req.user.id),
        supabase.from("treatment_records").select("no_booking, tarikh, masa, status, cancelled_by, created_at, staff_id, treatments(nama_rawatan)").eq("customer_id", req.user.id),
        supabase.from("oncall_records").select("no_booking, tarikh, masa, status, cancelled_by, created_at, staff_id, address").eq("customer_id", req.user.id)
      ]);

      let allNotifications = [];
      (prodOrders || []).forEach((o) => {
        allNotifications.push({ type: "product", ...o });
      });
      (bookOrders || []).forEach((b) => {
        allNotifications.push({
          type: "service",
          id: b.no_booking,
          status: b.status,
          cancelled_by: b.cancelled_by,
          created_at: b.created_at,
          date: b.tarikh,
          time: b.masa,
          staff_id: b.staff_id,
          service_name: b.haircuts
            ? b.haircuts.nama_potongan
            : "Servis Guntingan",
        });
      });
      (treatOrders || []).forEach((t) => {
        allNotifications.push({
          type: "service",
          id: t.no_booking,
          status: t.status,
          cancelled_by: t.cancelled_by,
          created_at: t.created_at,
          date: t.tarikh,
          time: t.masa,
          staff_id: t.staff_id,
          service_name: t.treatments ? t.treatments.nama_rawatan : "Rawatan",
        });
      });
      (oncallOrders || []).forEach((o) => {
        allNotifications.push({
          type: "service",
          id: o.no_booking,
          status: o.status,
          cancelled_by: o.cancelled_by,
          created_at: o.created_at,
          date: o.tarikh,
          time: o.masa,
          staff_id: o.staff_id,
          service_name: "On-Call Service",
        });
      });

      allNotifications.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      res.json({ status: "success", orders: allNotifications });
    } catch (error) {
      res
        .status(500)
        .json({
          status: "error",
          message: "Ralat pelayan memuat turun notifikasi.",
        });
    }
  },
);

router.put(
  "/products/:id/receive",
  authenticate,
  requireRole(["customer"]),
  async (req, res) => {
    try {
      const { error } = await supabase
        .from("product_orders")
        .update({ status: "Received" }) // [DIBAIKI] Ditukar ke Received mengikut kehendak
        .eq("id", req.params.id)
        .eq("customer_id", req.user.id);
      if (error) throw error;
      res.json({ status: "success", message: "Pesanan disahkan diterima." });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ralat pelayan." });
    }
  },
);

router.put(
  "/products/:id/ship",
  authenticate,
  requireRole(["admin", "owner"]),
  async (req, res) => {
    const { tracking_no } = req.body;
    
    // [DIBAIKI] Stored XSS via Nombor Tracking & Type Confusion
    const safeTrackingNo = String(tracking_no || "Tiada").replace(/<[^>]*>?/gm, "").substring(0, 100);

    try {
      const { data: order } = await supabase.from("product_orders").select("status, customer_id").eq("id", req.params.id).maybeSingle();
      if (!order) return res.status(404).json({ status: "error", message: "Pesanan tidak dijumpai." });

      const { error } = await supabase
        .from("product_orders")
        .update({ status: "Shipped", tracking_no: safeTrackingNo })
        .eq("id", req.params.id);
      if (error) throw error;

      if (order.status !== "Shipped") {
        const { data: cust } = await supabase.from("customers").select("phone, name").eq("id", order.customer_id).maybeSingle();
        if (cust && cust.phone) {
          const shippedMsg = `Dinspire Barbershop - Hai ${cust.name}, Pesanan anda telah dihantar! No Tracking: ${safeTrackingNo}. Terima kasih kerana membeli-belah dengan Dinspire!`;
          await sendSMS(cust.phone, shippedMsg, false);
        }
      }
      res.json({
        status: "success",
        message: "Pesanan dikemas kini ke Shipped.",
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ralat pelayan." });
    }
  },
);

router.post(
  "/reviews",
  authenticate,
  requireRole(["customer"]),
  async (req, res) => {
    let { order_no, stars, review_text } = req.body;
    order_no = String(order_no || "");
      try {
        if (!order_no)
          return res
            .status(400)
            .json({ status: "error", message: "No Tempahan wajib diisi." });
            
        // [DIBAIKI] Race Condition Lock untuk Ulasan (Elak botnet SPAM)
        if (reviewLocks.has(order_no)) {
          return res.status(409).json({ status: "error", message: "Ulasan anda sedang diproses. Sila tunggu sebentar." });
        }
        reviewLocks.add(order_no);

      // [DIBAIKI] Semakan Pemilikan Tempahan yang lebih terperinci
      let targetOrder = null;

      const { data: booking, error: errBooking } = await supabase
        .from("booking_records")
        .select("no_booking, status, customer_id")
        .eq("no_booking", order_no)
        .maybeSingle();
      
      if (booking) {
        targetOrder = booking;
      } else {
        const { data: treatment, error: errTreatment } = await supabase
          .from("treatment_records")
          .select("no_booking, status, customer_id")
          .eq("no_booking", order_no)
          .maybeSingle();
        
        if (treatment) {
          targetOrder = treatment;
        } else {
          const { data: oncall, error: errOncall } = await supabase
            .from("oncall_records")
            .select("no_booking, status, customer_id")
            .eq("no_booking", order_no)
            .maybeSingle();
            
          if (oncall) targetOrder = oncall;
          
          if (!booking && !treatment && !oncall && (errBooking || errTreatment || errOncall)) {
             console.error("DB Error:", errBooking, errTreatment, errOncall);
          }
        }
      }

      if (!targetOrder) {
        reviewLocks.delete(order_no);
        return res.status(400).json({ status: "error", message: `Tempahan ${order_no} tidak wujud dalam sistem.` });
      }

      if (targetOrder.customer_id !== req.user.id) {
        reviewLocks.delete(order_no);
        return res.status(403).json({ status: "error", message: "Akses ditolak. Ini bukan tempahan anda." });
      }

      // Supabase is case-sensitive, so we use toLowerCase() just in case the db has 'selesai' or 'SELESAI'
      if (String(targetOrder.status).toLowerCase() !== "selesai") {
        reviewLocks.delete(order_no);
        return res.status(400).json({ status: "error", message: `Tempahan ini berstatus '${targetOrder.status}'. Ia mesti 'Selesai' sebelum ulasan boleh dibuat.` });
      }

      const { data: existReview } = await supabase.from("reviews").select("id").eq("no_booking", order_no).maybeSingle();
      if (existReview) {
        reviewLocks.delete(order_no);
        return res.status(400).json({ status: "error", message: "Anda telah memberikan ulasan untuk tempahan ini." });
      }
        
      // [DIBAIKI] DB Exhaustion (Pengehadan Panjang Teks Ulasan)
      const safeReviewText = String(review_text || "").replace(/<[^>]*>?/gm, "").substring(0, 500);

      const { error } = await supabase
        .from("reviews")
          .insert([
            {
              no_booking: order_no,
              bintang: Math.max(1, Math.min(5, parseInt(stars) || 5)),
              review_text: safeReviewText,
            },
          ]);
      if (error) throw error;

      // Padam cache supaya ulasan baharu segera terpapar di laman utama
      cache.del("shop_data");
  
      reviewLocks.delete(order_no);
      res.json({
        status: "success",
        message: "Terima kasih atas ulasan anda!",
      });
    } catch (error) {
      if (typeof order_no !== "undefined") reviewLocks.delete(order_no);
      console.error("Ralat Ulasan:", error);
      res.status(500).json({ status: "error", message: "Gagal menghantar ulasan." });
    }
  },
);
// ==========================================
// 6. [BARU] Webhook Gateway FPX (Server-to-Server Callback)
// ==========================================
router.post("/webhook/fpx", async (req, res) => {
  const signature = req.headers["x-fpx-signature"] || req.headers["signature"] || req.query.signature;
  
  try {
    // 1. KESELAMATAN: Parse dan sahkan tandatangan menggunakan modul toyyibpay
    const paymentData = toyyibpay.parseWebhook(req.body);
    const { reference, status, transaction_id } = paymentData;
    
    // [DIBAIKI] Semakan Berkembar Server-to-Server
    let receiptValue = `FPX_FAILED:${transaction_id}`;
    if (status === "paid") {
      const isValid = await toyyibpay.verifyTransaction(transaction_id, reference);
      if (isValid) receiptValue = `FPX_PAID:${transaction_id}`;
    }
    
    // Tentukan table mana nak di-update (Guntingan, Rawatan, Oncall, Produk)
    let tableName = "booking_records";
    if (reference.startsWith("TR")) tableName = "treatment_records";
    else if (reference.startsWith("DBC")) tableName = "oncall_records";
    else if (reference.startsWith("PRD")) tableName = "product_orders";

    // 2. KEMASKINI DATABASE
    // Kita tak tukar column 'status' dari 'Belum' supaya slot tak terlepas.
    // Tapi kita kemas kini resit dengan tanda FPX_PAID. 
    // Untuk produk, status 'Preparing' kekal.
    const { error } = await supabase
      .from(tableName)
      .update({ resit: receiptValue })
      .eq(tableName === "product_orders" ? "id" : "no_booking", tableName === "product_orders" ? reference.replace("PRD-", "") : reference);
      
    if (error) {
      console.error("Gagal mengemaskini status webhook:", error);
      return res.status(500).json({ status: "error", message: "Database update failed" });
    }

    // Beritahu gateway FPX yang kita terima webhook ini dengan berjaya
    res.status(200).json({ status: "success", message: "Webhook processed securely" });

    } catch (error) {
      console.error("Ralat Keselamatan Webhook FPX:", error.message);
      res.status(403).json({ status: "error", message: "Gagal memproses webhook." });
    }
  });

// ========================================================
// [BAHARU] Pengesahan FPX Secara Langsung dari Pelanggan (Fallback jika Webhook Gagal)
// ========================================================
router.get("/fpx/verify", async (req, res) => {
  const { order_id, status_id, transaction_id } = req.query;
  if (!order_id || !status_id || !transaction_id) {
    return res.status(400).json({ status: "error", message: "Parameter tidak lengkap" });
  }

  try {
    // [DIBAIKI] Semakan Berkembar Server-to-Server (Bukan sekadar query parameters)
    const isSuccess = status_id === "1";
    let receiptValue = `FPX_FAILED:${transaction_id}`;
    if (isSuccess) {
      const isValid = await toyyibpay.verifyTransaction(transaction_id, order_id);
      if (isValid) receiptValue = `FPX_PAID:${transaction_id}`;
    }

    let tableName = "booking_records";
    if (order_id.startsWith("TR")) tableName = "treatment_records";
    else if (order_id.startsWith("DBC")) tableName = "oncall_records";
    else if (order_id.startsWith("PRD")) tableName = "product_orders";

    // Semak status semasa
    const { data: existingData } = await supabase
      .from(tableName)
      .select("resit")
      .eq(tableName === "product_orders" ? "id" : "no_booking", tableName === "product_orders" ? order_id.replace("PRD-", "") : order_id)
      .single();

    if (existingData && existingData.resit && (typeof existingData.resit === "string" && existingData.resit.startsWith("FPX_PENDING:"))) {
      // Hanya kemaskini jika ia masih PENDING
      const { error } = await supabase
        .from(tableName)
        .update({ resit: receiptValue })
        .eq(tableName === "product_orders" ? "id" : "no_booking", tableName === "product_orders" ? order_id.replace("PRD-", "") : order_id);

      if (error) {
        console.error("Gagal mengemaskini status verify FPX:", error);
      }
    }

    res.status(200).json({ status: "success", message: "Verification processed" });
  } catch (error) {
    console.error("Ralat FPX Verify:", error);
    res.status(500).json({ status: "error", message: "Ralat pelayan" });
  }
});

module.exports = router;

