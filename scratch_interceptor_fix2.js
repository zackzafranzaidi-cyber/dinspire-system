const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const newInterceptor = `
  // ========================================================
  // GOD MODE: SURGICAL SWITCHBOARD INTERCEPTOR
  // ========================================================
  app.use((req, res, next) => {
    // 1. Webhooks & Dev Portal dipintas (Bypass)
    if (req.originalUrl.includes("/webhook/fpx") || req.originalUrl.includes("/dev-sys-9x8q2") || req.originalUrl.includes("/shop-data")) {
      return next();
    }

    const referer = req.headers.referer || "";
    const origin = req.headers.origin || "";
    const isCustomerApp = referer.includes("customer.") || origin.includes("customer.") || referer.includes("/customer/") || req.originalUrl.startsWith("/customer/");
    const isStaffApp = referer.includes("staff.") || origin.includes("staff.") || referer.includes("/staff/") || req.originalUrl.startsWith("/staff/");

    // 2. Kunci Keseluruhan Sistem (Global Maintenance)
    if (global.featureFlags && global.featureFlags.maintenance_mode === true) {
      return res.status(503).json({ status: "error", message: "Sistem Sedang Diselenggara (Senggara Berpusat)." });
    }

    // 3. Suis Khusus Portal (Menyekat API berdasarkan Sumber / Referer)
    if (global.featureFlags) {
      if (global.featureFlags.customer_portal === false && isCustomerApp) {
        return res.status(403).json({ status: "error", message: "Portal Pelanggan Ditutup Sementara oleh Pembangun." });
      }
      if (global.featureFlags.staff_portal === false && isStaffApp) {
        return res.status(403).json({ status: "error", message: "Portal Staf Ditutup Sementara." });
      }
    }

    next();
  });
`;

serverJs = serverJs.replace(/\/\/ GOD MODE: SURGICAL SWITCHBOARD INTERCEPTOR[\s\S]*?next\(\);\n  }\);\n/, newInterceptor + '\n');
fs.writeFileSync('server.js', serverJs);
console.log('Interceptor updated to allow shop-data.');
