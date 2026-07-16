require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const schedule = require("node-schedule");
const supabase = require("./config/db");
const logger = require("./utils/logger"); // Import Winston logger
const app = express();

// ========================================================
// [DIBAIKI] Pengesahan Kunci Kriptografi & Fail-Fast Mechanism
// ========================================================
if (!process.env.JWT_SECRET_CLIENT || !process.env.JWT_SECRET_SYS) {
  console.error("FATAL ERROR: JWT_SECRET tidak dijumpai. Sistem dimatikan (Fail-Fast) bagi mengelak pemalsuan JWT.");
  process.exit(1);
}

// ========================================================
// Pangkalan JWT Blacklist Global (Sesi Zombie In-Memory)
// ========================================================
global.jwtBlacklist = new Set();

// ========================================================
// [DIBAIKI] Perlindungan Tambahan (Enterprise-Grade Security)
// ========================================================
app.disable("x-powered-by"); // Menghalang 'Information Disclosure' pelayan Express
app.use(helmet());
app.use(compression());

// [DIBAIKI] Menghalang Pelayar dari Menyimpan (Cache) Data Sensitif (JSON Leak)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minit
  max: 500, // 500 permintaan setiap 15 minit untuk API am
  message: {
    status: "error",
    message: "Trafik terlalu tinggi. Sila cuba lagi selepas 15 minit.",
  },
});
app.use("/api/", globalLimiter);

// 1. Tetapan CORS menggunakan persekitaran
// Nota Keselamatan: !origin membenarkan akses dari sumber bukan pelayar (seperti Postman/Mobile App).
// Jika backend ini hanya untuk laman web, !origin harus dibuang untuk mengelakkan eksploitasi API secara terus.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim())
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.indexOf(origin) !== -1 ||
      origin === "https://dinspirebarbershop.com" ||
      origin.endsWith(".dinspirebarbershop.com") ||
      origin.endsWith(".vercel.app")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Akses CORS ditolak oleh pelayan keselamatan."));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

// ========================================================
// [DIBAIKI] 2. Pengasingan Had Saiz Muatan (Payload Limit)
// ========================================================

// A. Had 10MB KHUSUS untuk laluan yang memuat naik fail Base64 (Imej)
// - /api/bookings: Pelanggan/Staf muat naik gambar resit transaksi
// - /api/admin: Pentadbir muat naik gambar poster promosi atau produk
app.use("/api/bookings", express.json({ limit: "10mb" }));
app.use("/api/admin", express.json({ limit: "10mb" }));

// B. Had 100KB (Saiz sangat kecil) untuk SEMUA laluan API yang lain
// - Melindungi laluan kritikal seperti /api/auth daripada lambakan teks besar (Serangan DoS)
app.use(express.json({ limit: "100kb" }));

// ========================================================

// 3. Import routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const staffRoutes = require("./routes/staff");
const shopRoutes = require("./routes/shop");
const ownerRoutes = require("./routes/owner");
const adminRoutes = require("./routes/admin");

// 4. Gunakan routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/shop-data", shopRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);

// ... (kod routes sedia ada seperti app.use('/api/admin', adminRoutes); )

// ========================================================
// [DIBAIKI] Pengendali Ralat Global (Global Error Handler)
// ========================================================
// Ini akan menangkap sebarang kerosakan pelayan dan menghalang pendedahan kod dalaman (Stack Trace)
app.use((err, req, res, next) => {
  // Rekod ralat ke dalam sistem log fail (Winston)
  logger.error(`[Global Error] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
  });

  // Jika ralat disebabkan oleh saiz payload melebihi had 10MB/100KB
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      status: "error",
      message: "Saiz fail atau muatan terlalu besar. Sila kurangkan saiz data.",
    });
  }

  // Untuk ralat-ralat lain
  res.status(500).json({
    status: "error",
    message: "Ralat dalaman pelayan berlaku! Sila cuba sebentar lagi.",
  });
});

// ========================================================
// [DIBAIKI] Auto-Recovery SMS Jadual In-Memory
// ========================================================
async function recoverSMSReminders() {
  try {
    console.log("Menyemak pemulihan SMS Peringatan...");
    
    // Tarik tempahan 'Aktif'
    const { data: bookings } = await supabase
      .from("booking_records")
      .select("no_booking, tarikh, masa, no_phone")
      .eq("status", "Aktif");

    if (bookings) {
      bookings.forEach((b) => {
        if (!b.tarikh || !b.masa) return;
        const bDate = new Date(`${b.tarikh}T${b.masa}`);
        const reminderTime = new Date(bDate.getTime() - 2 * 60 * 60 * 1000);
        
        if (reminderTime > new Date()) {
          schedule.scheduleJob(reminderTime, function() {
            console.log(`\n[AUTO-RECOVERY SMS] Hantar ke: ${b.no_phone} | Tempahan: ${b.no_booking}`);
          });
        }
      });
      console.log(`Berjaya memulihkan ${bookings.length} jadual SMS Tempahan.`);
    }

    // Tarik oncall 'Aktif'
    const { data: oncalls } = await supabase
      .from("oncall_records")
      .select("no_booking, tarikh, masa, customer_id")
      .eq("status", "Aktif");
      
    if (oncalls) {
      oncalls.forEach((o) => {
        if (!o.tarikh || !o.masa) return;
        const oDate = new Date(`${o.tarikh}T${o.masa}`);
        const reminderTime = new Date(oDate.getTime() - 2 * 60 * 60 * 1000);
        
        if (reminderTime > new Date()) {
          schedule.scheduleJob(reminderTime, function() {
            console.log(`\n[AUTO-RECOVERY SMS] Hantar ke Pelanggan On-Call ID: ${o.customer_id} | Tempahan: ${o.no_booking}`);
          });
        }
      });
      console.log(`Berjaya memulihkan ${oncalls.length} jadual SMS On-Call.`);
    }

  } catch (error) {
    console.error("Gagal memulihkan SMS jadual:", error);
  }
}

// Mulakan Pelayan
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server Dinspire berjalan di port ${PORT}`);
  await recoverSMSReminders(); // Jalankan Auto-Recovery selepas pelayan hidup
});
