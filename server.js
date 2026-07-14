require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger"); // Import Winston logger
const app = express();

// ========================================================
// [DIBAIKI] Perlindungan Tambahan (Enterprise-Grade Security)
// ========================================================
app.use(helmet());
app.use(compression());

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
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
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

// Mulakan Pelayan
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Dinspire berjalan di port ${PORT}`);
});
