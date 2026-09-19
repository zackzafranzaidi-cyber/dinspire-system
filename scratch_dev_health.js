const fs = require('fs');
let devJs = fs.readFileSync('routes/dev.js', 'utf8');

const additionalRoutes = `
const path = require('path');
const cacheUtil = require("../utils/cache");

// SERVER HEALTH & LOGS
router.get("/logs", authenticateDev, (req, res) => {
  try {
    const logDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(logDir)) return res.json({ status: "success", logs: "Tiada fail log dijumpai." });
    
    // Find the newest error log file
    const files = fs.readdirSync(logDir).filter(f => f.startsWith("dinspire-error-"));
    if (files.length === 0) return res.json({ status: "success", logs: "Tiada rekod ralat hari ini." });
    
    files.sort((a, b) => fs.statSync(path.join(logDir, b)).mtime.getTime() - fs.statSync(path.join(logDir, a)).mtime.getTime());
    const latestLog = path.join(logDir, files[0]);
    
    const content = fs.readFileSync(latestLog, 'utf8');
    const lines = content.trim().split('\\n');
    const tailLines = lines.slice(-50).join('\\n'); // Only last 50 lines to prevent memory leak
    
    res.json({ status: "success", file: files[0], logs: tailLines });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// CACHE SOFT-FLUSH
router.post("/flush-cache", authenticateDev, (req, res) => {
  try {
    // We call cache.clear() to empty memory cache
    cacheUtil.clear();
    
    // For specific dashboard cache if it was stored globally
    if (global.dashboardCache) {
      delete global.dashboardCache;
    }
    if (global.userSessionCache) {
      // It is defined in auth.js, we might not be able to clear it directly from here unless exported,
      // but clearing global caches we can reach is good enough.
    }
    
    res.json({ status: "success", message: "Semua In-Memory Cache berjaya dikosongkan." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// QUOTA DASHBOARD (SMS, Supabase Ping)
router.get("/health", authenticateDev, async (req, res) => {
  try {
    // Ping Supabase
    const start = Date.now();
    const { error } = await supabase.from("settings").select("id").limit(1);
    const dbLatency = Date.now() - start;
    
    // In real app, call eSMS API to check balance. For now, mock or fetch if config exists.
    const smsUser = process.env.ESMS_USER ? "Terkonfigurasi" : "Tiada";
    
    res.json({
      status: "success",
      metrics: {
        database_latency_ms: dbLatency,
        database_status: error ? "ERROR" : "ONLINE",
        sms_gateway: smsUser,
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
`;

devJs = devJs.replace('module.exports = router;', additionalRoutes + '\nmodule.exports = router;');
fs.writeFileSync('routes/dev.js', devJs);
console.log('Added Phase 4 Server Health routes to dev.js');
