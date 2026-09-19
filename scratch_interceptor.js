const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const switchboardInterceptor = `
  // ========================================================
  // GOD MODE: SURGICAL SWITCHBOARD INTERCEPTOR
  // ========================================================
  app.use((req, res, next) => {
    // 1. Webhooks & Dev Portal dipintas (Bypass)
    if (req.originalUrl.includes("/webhook/fpx") || req.originalUrl.includes("/dev-sys-9x8q2")) {
      return next();
    }

    // 2. Kunci Keseluruhan Sistem (Global Maintenance)
    if (global.featureFlags && global.featureFlags.maintenance_mode === true) {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(503).json({ status: "error", message: "Sistem Sedang Diselenggara (Senggara Berpusat)." });
      } else {
        return res.status(503).send("<h1>Sistem Dinspire Sedang Diselenggara</h1><p>Sila kembali sebentar lagi.</p>");
      }
    }

    // 3. Suis Khusus Portal
    if (global.featureFlags) {
      if (global.featureFlags.customer_portal === false && (req.originalUrl.startsWith("/customer/") || req.originalUrl === "/" || req.originalUrl === "/index.html")) {
        return res.status(403).send("<h1>Portal Pelanggan Ditutup Sementara</h1><p>Pembangun sedang menaiktaraf fungsi.</p>");
      }
      if (global.featureFlags.staff_portal === false && req.originalUrl.startsWith("/staff/")) {
        return res.status(403).send("<h1>Portal Staf Ditutup Sementara</h1><p>Sila hubungi Admin.</p>");
      }
    }

    next();
  });
`;

// Insert it right before express.static
serverJs = serverJs.replace('// SERVE STATIC FILES', switchboardInterceptor + '\n  // SERVE STATIC FILES');
fs.writeFileSync('server.js', serverJs);
console.log('Switchboard Interceptor injected into server.js');
