const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const crypto = require("crypto");
const cache = require("../utils/cache");
const schedule = require("node-schedule");

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

async function uploadReceiptToStorage(base64Image, orderNo) {
  if (!base64Image || !base64Image.startsWith("data:image")) return base64Image;
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

    const fileName = `receipt_${orderNo}_${Date.now()}.${realExtension}`;

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

const fpx = require("../utils/fpx");

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

  try {
    const { data: cust } = await supabase
      .from("customers")
      .select("name, phone")
      .eq("id", customer_id)
      .single();
    if (!cust)
      return res
        .status(404)
        .json({ status: "error", message: "Sesi tidak sah." });

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
      if (svc) harga_rm = parseFloat(svc.harga);
      order_no = "TR" + Math.floor(1000 + Math.random() * 9000);
    } else {
      const { data: svc } = await supabase
        .from("haircuts")
        .select("harga")
        .eq("id", service_id)
        .maybeSingle();
      if (svc) harga_rm = parseFloat(svc.harga);
      order_no = "DB" + Math.floor(1000 + Math.random() * 9000);
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
      return res
        .status(409)
        .json({
          status: "error",
          message: "Maaf, slot ini baru sahaja ditempah oleh pelanggan lain.",
        });
    }

    // FPX Payment Generation
    const total_amount = harga_rm + serviceFee;
    const protocol = req.protocol === 'http' ? 'https' : req.protocol; // enforce https for production callback
    const host = req.get('host');
    const returnUrl = `${protocol}://${host}/dashboard.html?fpx=return`;
    const callbackUrl = `${protocol}://${host}/api/bookings/webhook/fpx`;
    
    let fpxResult;
    try {
      fpxResult = await fpx.createPayment(
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

    const basePayload = {
      no_booking: order_no,
      nama_pelanggan: cust.name,
      no_phone: cust.phone,
      tarikh: booking_date,
      masa: booking_time,
      staff_id: staff_id,
      harga_rm: harga_rm,
      service_fee: serviceFee,
      resit: `FPX_PENDING:${fpxResult.transaction_id}`,
      status: "Belum",
    };

    if (booking_type === "treatment") {
      basePayload.jenis_rawatan = service_id;
      const { error } = await supabase
        .from("treatment_records")
        .insert([basePayload]);
      if (error) throw error;
    } else {
      basePayload.jenis_haircut = service_id;
      const { error } = await supabase
        .from("booking_records")
        .insert([basePayload]);
      if (error) throw error;
    }

    // SIMULASI SMS TEMPahan BERJAYA
    console.log(`\n========================================`);
    console.log(`[SIMULASI SMS - BOOKING BERJAYA] Hantar ke: ${cust.phone}`);
    console.log(`Mesej: Tempahan berjaya! No: ${order_no}. Tarikh: ${booking_date} Masa: ${booking_time}.`);
    console.log(`========================================\n`);

    // PERINGATAN 2 JAM
    try {
      const bookingDateTime = new Date(`${booking_date}T${booking_time}`);
      const reminderTime = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
      if (reminderTime > new Date()) {
        schedule.scheduleJob(reminderTime, function() {
          console.log(`\n========================================`);
          console.log(`[SIMULASI SMS - PERINGATAN 2 JAM] Hantar ke: ${cust.phone}`);
          console.log(`Mesej: Peringatan mesra! Tempahan anda (${order_no}) akan bermula pada ${booking_time}. Sila hadir awal.`);
          console.log(`========================================\n`);
        });
      }
    } catch (e) {
      console.error("Gagal menetapkan jadual peringatan SMS:", e);
    }

    res.json({ 
      status: "success", 
      message: "Pembayaran sedang diproses", 
      order_no,
      payment_url: fpxResult.payment_url 
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ status: "error", message: "Maaf, slot ini baru sahaja ditempah oleh pelanggan lain pada saat yang sama (Tindanan berlaku)." });
    }
    res
      .status(500)
      .json({ status: "error", message: "Ralat pelayan memproses tempahan." });
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
    const { orderNo } = req.params;
    const { final_price, receipt_url } = req.body;

    const parsedPrice = parseFloat(final_price);
    if (isNaN(parsedPrice) || parsedPrice < 0)
      return res
        .status(400)
        .json({ status: "error", message: "Harga tidak sah!" });

    let finalReceiptUrl = await uploadReceiptToStorage(receipt_url, orderNo);

    try {
      let tableName = "booking_records";
      if (orderNo.startsWith("TR")) tableName = "treatment_records";
      else if (orderNo.startsWith("DBC")) tableName = "oncall_records";

      let query = supabase
        .from(tableName)
        .update({ status: "Selesai", harga_rm: parsedPrice })
        .eq("no_booking", orderNo);
      if (finalReceiptUrl)
        query = supabase
          .from(tableName)
          .update({
            status: "Selesai",
            harga_rm: parsedPrice,
            resit: finalReceiptUrl,
          })
          .eq("no_booking", orderNo);
      if (req.user.role === "staff") query = query.eq("staff_id", req.user.id);

      const { error } = await query;
      if (error) throw error;

      res.json({ status: "success", message: "Servis disahkan selesai" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ralat pelayan." });
    }
  },
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
      service_id,
      booking_date,
      booking_time,
      payment_method,
      receipt_url,
      price,
    } = req.body;
    const staff_id = req.user.id;
    const parsedPrice = parseFloat(price) || 0.0;
    const receiptName = "WLK" + Math.floor(1000 + Math.random() * 9000);
    let finalReceiptUrl = await uploadReceiptToStorage(
      receipt_url,
      receiptName,
    );

    try {
      const { error } = await supabase.from("walkin_records").insert([
        {
          nama_pelanggan: customer_name,
          no_phone: "-",
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

    try {
      const { data: cust } = await supabase
        .from("customers")
        .select("name")
        .eq("id", customer_id)
        .single();
      if (!cust)
        return res
          .status(404)
          .json({ status: "error", message: "Pelanggan tidak dijumpai." });

      const { data: setSvc } = await supabase
        .from("settings")
        .select("setting_value")
        .eq("setting_key", "service_fee")
        .maybeSingle();
      let serviceFee = setSvc ? parseFloat(setSvc.setting_value) : 0;

      let harga_rm = 0.0;
      const { data: svcHaircut } = await supabase
        .from("haircuts")
        .select("harga")
        .eq("id", service_id)
        .maybeSingle();
      if (svcHaircut) harga_rm = parseFloat(svcHaircut.harga);

      const order_no = "DBC" + Math.floor(1000 + Math.random() * 9000);
      
      // FPX Payment Generation
      const total_amount = harga_rm + serviceFee;
      const protocol = req.protocol === 'http' ? 'https' : req.protocol;
      const host = req.get('host');
      const returnUrl = `${protocol}://${host}/dashboard.html?fpx=return`;
      const callbackUrl = `${protocol}://${host}/api/bookings/webhook/fpx`;
      
      let fpxResult;
      try {
        fpxResult = await fpx.createPayment(
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

      const { error } = await supabase.from("oncall_records").insert([
        {
          no_booking: order_no,
          nama_pelanggan: cust.name,
          tarikh: date,
          masa: time,
          lokasi: address,
          jenis_haircut: service_id,
          staff_id: barber,
          harga_rm: harga_rm,
          service_fee: serviceFee,
          resit: `FPX_PENDING:${fpxResult.transaction_id}`,
          status: "Belum",
        },
      ]);

      if (error) throw error;

      console.log(`\n========================================`);
      console.log(`[SIMULASI SMS - ON-CALL BERJAYA] Hantar kepada Pelanggan: ${cust.name}`);
      console.log(`Mesej: Tempahan On-Call berjaya! No: ${order_no}. Tarikh: ${date} Masa: ${time}. Barber akan ke lokasi anda.`);
      console.log(`========================================\n`);

      try {
        const bookingDateTime = new Date(`${date}T${time}`);
        const reminderTime = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
        if (reminderTime > new Date()) {
          schedule.scheduleJob(reminderTime, function() {
            console.log(`\n========================================`);
            console.log(`[SIMULASI SMS - PERINGATAN ON-CALL 2 JAM] Hantar kepada Pelanggan: ${cust.name}`);
            console.log(`Mesej: Peringatan! Sila bersedia di lokasi anda, Barber On-Call anda akan tiba dalam masa 2 jam.`);
            console.log(`========================================\n`);
          });
        }
      } catch (e) {
        console.error("Gagal menetapkan jadual peringatan SMS On-Call:", e);
      }
      res.json({
        status: "success",
        message: "Pembayaran On-Call sedang diproses",
        order_no,
        payment_url: fpxResult.payment_url
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ralat pelayan." });
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

      const { data: cust } = await supabase
        .from("customers")
        .select("name")
        .eq("id", customer_id)
        .single();
      if (!cust)
        return res
          .status(404)
          .json({ status: "error", message: "Sesi anda tamat." });

      // AMBIL HARGA SEBENAR DARI PANGKALAN DATA SUPABASE
      const itemIds = Object.keys(cart_items);
      if (itemIds.length === 0)
        return res
          .status(400)
          .json({ status: "error", message: "Troli kosong." });

      const { data: productsDB } = await supabase
        .from("products")
        .select("id, nama, harga")
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
          let qty = parseInt(cart_items[id].qty) || 1;
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

      const order_uuid = crypto.randomUUID();
      const receipt_name = "PRD" + Math.floor(100000 + Math.random() * 900000);
      
      // FPX Payment Generation
      const total_amount = totalProductsPrice + shippingFee;
      const protocol = req.protocol === 'http' ? 'https' : req.protocol;
      const host = req.get('host');
      const returnUrl = `${protocol}://${host}/dashboard.html?fpx=return`;
      const callbackUrl = `${protocol}://${host}/api/bookings/webhook/fpx`;
      
      let fpxResult;
      try {
        fpxResult = await fpx.createPayment(
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

      const { error } = await supabase.from("product_orders").insert([
        {
          id: order_uuid,
          nama_pembeli: cust.name,
          senarai_produk: JSON.stringify(trustedCartItems), // Simpan data yang telah disucikan
          lokasi_penghantaran: address,
          resit: `FPX_PENDING:${fpxResult.transaction_id}`,
          shipping_fee: shippingFee,
          status: "Preparing",
        },
      ]);

      if (error) throw error;

      console.log(`\n========================================`);
      console.log(`[SIMULASI SMS - ORDER PRODUK BERJAYA] Hantar ke: ${cust.name}`);
      console.log(`Mesej: Terima kasih! Pesanan produk anda sedang disediakan. Kami akan maklumkan nombor tracking kelak.`);
      console.log(`========================================\n`);
      res.json({
        status: "success",
        message: "Pembayaran produk sedang diproses",
        payment_url: fpxResult.payment_url
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "error", message: "Ralat memproses pesanan." });
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
        .select("name, phone")
        .eq("id", req.user.id)
        .single();
      if (!cust)
        return res.json({ status: "error", message: "Akaun tidak dijumpai" });

      const { data: prodOrders } = await supabase
        .from("product_orders")
        .select("id, senarai_produk, status, tracking_no, created_at")
        .eq("nama_pembeli", cust.name);
      const { data: bookOrders } = await supabase
        .from("booking_records")
        .select(
          "no_booking, tarikh, masa, status, created_at, haircuts(nama_potongan)",
        )
        .eq("no_phone", cust.phone);
      const { data: treatOrders } = await supabase
        .from("treatment_records")
        .select(
          "no_booking, tarikh, masa, status, created_at, treatments(nama_rawatan)",
        )
        .eq("no_phone", cust.phone);
      const { data: oncallOrders } = await supabase
        .from("oncall_records")
        .select(
          "no_booking, tarikh, masa, status, created_at, haircuts(nama_potongan)",
        )
        .eq("nama_pelanggan", cust.name);

      let allNotifications = [];
      (prodOrders || []).forEach((o) => {
        allNotifications.push({ type: "product", ...o });
      });
      (bookOrders || []).forEach((b) => {
        allNotifications.push({
          type: "service",
          id: b.no_booking,
          status: b.status,
          created_at: b.created_at,
          date: b.tarikh,
          time: b.masa,
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
          created_at: t.created_at,
          date: t.tarikh,
          time: t.masa,
          service_name: t.treatments
            ? t.treatments.nama_rawatan
            : "Servis Rawatan",
        });
      });
      (oncallOrders || []).forEach((o) => {
        allNotifications.push({
          type: "oncall",
          id: o.no_booking,
          status: o.status,
          created_at: o.created_at,
          date: o.tarikh,
          time: o.masa,
          service_name: o.haircuts
            ? o.haircuts.nama_potongan
            : "Servis On-Call",
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
        .update({ status: "Delivered" })
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
    try {
      const { error } = await supabase
        .from("product_orders")
        .update({ status: "Shipped", tracking_no: tracking_no || "Tiada" })
        .eq("id", req.params.id);
      if (error) throw error;

      console.log(`\n========================================`);
      console.log(`[SIMULASI SMS - ORDER SHIPPED] Hantar untuk order ID: ${req.params.id}`);
      console.log(`Mesej: Pesanan anda telah dihantar! No Tracking: ${tracking_no || "Sila rujuk sistem"}. Terima kasih kerana membeli-belah dengan Dinspire!`);
      console.log(`========================================\n`);
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
    const { order_no, stars, review_text } = req.body;
    try {
      if (!order_no)
        return res
          .status(400)
          .json({ status: "error", message: "No Tempahan wajib diisi." });

      // [DIBAIKI] Semakan Pemilikan Tempahan untuk mengelakkan Spam
      const { data: validBooking } = await supabase
        .from("booking_records")
        .select("id")
        .eq("no_booking", order_no)
        .eq("status", "Selesai")
        .eq("customer_id", req.user.id)
        .single();
        
      const { data: validTreatment } = await supabase
        .from("treatment_records")
        .select("id")
        .eq("no_booking", order_no)
        .eq("status", "Selesai")
        .eq("customer_id", req.user.id)
        .single();

      if (!validBooking && !validTreatment) {
        return res.status(403).json({ status: "error", message: "Akses ditolak. Tempahan tidak sah atau belum selesai." });
      }

      const { error } = await supabase
        .from("reviews")
        .insert([
          {
            no_booking: order_no,
            bintang: parseInt(stars),
            review_text: review_text,
          },
        ]);
      if (error) throw error;

      // Padam cache supaya ulasan baharu segera terpapar di laman utama
      cache.del("shop_data");

      res.json({ status: "success", message: "Ulasan berjaya disimpan." });
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: "Ralat menyimpan ulasan." });
    }
  },
);
// ==========================================
// 6. [BARU] Webhook Gateway FPX (Server-to-Server Callback)
// ==========================================
router.post("/webhook/fpx", async (req, res) => {
  const signature = req.headers["x-fpx-signature"] || req.headers["signature"] || req.query.signature;
  
  try {
    // 1. KESELAMATAN: Parse dan sahkan tandatangan menggunakan modul utilities fpx yang selamat
    const paymentData = fpx.parseWebhook(req.body, signature);
    const { reference, status, transaction_id } = paymentData;
    
    // FPX_PAID atau FPX_FAILED
    const receiptValue = status === "paid" ? `FPX_PAID:${transaction_id}` : `FPX_FAILED:${transaction_id}`;
    
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
      .eq(tableName === "product_orders" ? "id" : "no_booking", reference);
      
    if (error) {
      console.error("Gagal mengemaskini status webhook:", error);
      return res.status(500).json({ status: "error", message: "Database update failed" });
    }

    // Beritahu gateway FPX yang kita terima webhook ini dengan berjaya
    res.status(200).json({ status: "success", message: "Webhook processed securely" });

  } catch (error) {
    console.error("Ralat Keselamatan Webhook FPX:", error.message);
    res.status(403).json({ status: "error", message: error.message });
  }
});

module.exports = router;
