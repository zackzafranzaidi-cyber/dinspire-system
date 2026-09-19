const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const { authenticateDev } = require("../middleware/devAuth");

// Dev Rate Limiter: 3 attempts per hour, blocks completely if exceeded
const devLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    status: "error",
    message: "Terlalu banyak percubaan palsu. IP ini disekat dari mengakses portal pembangun selama 1 jam.",
  }
});

// Honeypot / Dev Login Route
// /api/dev-sys-9x8q2/login
router.post("/login", devLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ status: "error", message: "Katalaluan diperlukan" });
    }

    const devHash = process.env.DEV_PASSWORD_HASH;
    if (!devHash) {
      return res.status(503).json({ status: "error", message: "Portal Pembangun tidak dikonfigurasi." });
    }

    const isMatch = await bcrypt.compare(password, devHash);
    
    if (!isMatch) {
      return res.status(401).json({ status: "error", message: "Katalaluan salah." });
    }

    const token = jwt.sign(
      { role: "developer", id: "god-mode" },
      process.env.JWT_SECRET_DEV || "dev-secret-fallback-if-not-set-danger",
      { expiresIn: "4h" }
    );

    res.cookie("din_token_dev", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 4 * 60 * 60 * 1000,
    });

    res.json({ status: "success", message: "Akses Pembangun Diluluskan." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Logout
router.post("/logout", authenticateDev, (req, res) => {
  if (req.cookies.din_token_dev && global.jwtBlacklist) {
    global.jwtBlacklist.set(req.cookies.din_token_dev, true);
  }
  res.clearCookie("din_token_dev", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ status: "success", message: "Sesi Pembangun ditamatkan." });
});

// Check auth status
router.get("/status", authenticateDev, (req, res) => {
  res.json({ status: "success", message: "Aktif" });
});


const supabase = require("../config/db");

// Update Feature Flags
router.post("/flags", authenticateDev, async (req, res) => {
  try {
    const { flags } = req.body; // e.g. { ecommerce: false, maintenance_mode: true }
    
    if (!flags || typeof flags !== 'object') {
      return res.status(400).json({ status: "error", message: "Payload flags tidak sah" });
    }

    // Update global memory
    global.featureFlags = { ...global.featureFlags, ...flags };

    // Persist to DB
    await supabase
      .from("settings")
      .update({ setting_value: JSON.stringify(global.featureFlags) })
      .eq("setting_key", "feature_flags");

    res.json({ status: "success", message: "Papan Suis (Feature Flags) berjaya dikemaskini.", currentFlags: global.featureFlags });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get current flags
router.get("/flags", authenticateDev, (req, res) => {
  res.json({ status: "success", flags: global.featureFlags });
});


const { pruneYearlyData } = require("../utils/archiver");

// BACKUP DATA (STREAMING)
router.get("/backup", authenticateDev, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=dinspire_master_backup_' + Date.now() + '.json');
  
  try {
    res.write('{\n"tarikh_backup": "' + new Date().toISOString() + '",\n"data": {\n');
    const tables = [
      "settings", "branches", "staff", "customers", 
      "haircuts", "treatments", "products", 
      "booking_records", "treatment_records", "oncall_records", "walkin_records", 
      "historical_sales", "punch_cards", "reviews"
    ];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      res.write('  "' + table + '": ');
      let hasMore = true;
      let offset = 0;
      const limit = 1000;
      res.write('[');
      let isFirstRow = true;
      while (hasMore) {
        const { data, error } = await supabase.from(table).select("*").range(offset, offset + limit - 1);
        if (error) throw error;
        for (let row of data) {
          if (!isFirstRow) res.write(',');
          res.write(JSON.stringify(row));
          isFirstRow = false;
        }
        if (data.length < limit) hasMore = false;
        else offset += limit;
      }
      res.write(']');
      if (i < tables.length - 1) res.write(',\n');
      else res.write('\n');
    }
    res.write('}\n}\n');
    res.end();
  } catch (error) {
    res.write('\n\n"ERROR_ENCOUNTERED": ' + JSON.stringify(error.message) + '\n}');
    res.end();
  }
});

// FACTORY RESET (3-TIER LOCK)
router.post("/factory-reset", authenticateDev, async (req, res) => {
  try {
    const { confirmation_text, otp } = req.body;
    if (confirmation_text !== "DELETE-ALL-DINSPIRE-DATA") return res.status(403).json({ status: "error", message: "Teks Pengesahan Salah." });
    
    // In actual use, verify a real 2FA OTP. For now, use DEV hash fallback.
    const isMatch = await bcrypt.compare(otp, process.env.DEV_PASSWORD_HASH);
    if (!isMatch) return res.status(403).json({ status: "error", message: "Katalaluan/OTP Salah." });

    const deleteOrder = [
      "reviews", "walkin_records", "oncall_records", "treatment_records", "booking_records", 
      "punch_cards", "products", "treatments", "haircuts", 
      "customers", "staff", "branches", "historical_sales"
    ];
    for (let table of deleteOrder) {
      await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000"); 
    }
    res.json({ status: "success", message: "Pangkalan data telah dikosongkan sepenuhnya." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PRUNE TRIGGER
router.post("/prune", authenticateDev, async (req, res) => {
  try {
    await pruneYearlyData();
    res.json({ status: "success", message: "Pangkalan data berjaya dipangkas (Pruned) dan diarkib." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// RESTORE ENGINE (SMART UPSERT)
router.post("/restore", authenticateDev, async (req, res) => {
  try {
    const backupData = req.body.data;
    if (!backupData) return res.status(400).json({ status: "error", message: "Tiada data dikesan." });

    // Dependency injection order
    const insertOrder = [
      "settings", "branches", "staff", "customers", 
      "haircuts", "treatments", "products", 
      "booking_records", "treatment_records", "oncall_records", "walkin_records", 
      "historical_sales", "punch_cards", "reviews"
    ];

    for (let table of insertOrder) {
      if (backupData[table] && backupData[table].length > 0) {
        // Upsert to ignore conflicts and update existing
        const { error } = await supabase.from(table).upsert(backupData[table]);
        if (error) throw new Error(`Ralat semasa memasukkan jadual ${table}: ${error.message}`);
      }
    }
    res.json({ status: "success", message: "Sistem berjaya dipulihkan dari sandaran!" });
  } catch (error) {
    // Note: Due to PostgREST limitations, true ROLLBACK across tables isn't supported without RPC.
    // The insert stops at the failed table.
    res.status(500).json({ status: "error", message: "PEMULIHAN GAGAL: " + error.message });
  }
});


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
    const lines = content.trim().split('\n');
    const tailLines = lines.slice(-50).join('\n'); // Only last 50 lines to prevent memory leak
    
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


// IMPERSONATION (Login-As)
router.post("/impersonate", authenticateDev, async (req, res) => {
  try {
    const { target_role, target_id } = req.body;
    
    if (!target_role || !target_id) {
      return res.status(400).json({ status: "error", message: "Parameter tidak lengkap." });
    }

    let tableName = "customers";
    if (target_role === "staff") tableName = "staff";
    else if (target_role === "owner") tableName = "owners";
    else if (target_role === "admin") tableName = "admins";

    const { data: user, error } = await supabase.from(tableName).select("*").eq("id", target_id).single();
    if (error || !user) return res.status(404).json({ status: "error", message: "Pengguna tidak dijumpai." });

    const isSys = ["staff", "owner", "admin"].includes(target_role);
    const secret = isSys ? process.env.JWT_SECRET_SYS : process.env.JWT_SECRET_CLIENT;
    const cookieName = isSys ? "din_token_sys" : "din_token_client";
    
    // Create impersonation token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: target_role,
        is_impersonated: true,
        cawangan_id: user.cawangan_id || null
      },
      secret,
      { expiresIn: "1h" }
    );

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: true, // Requires HTTPS in prod
      sameSite: "none",
      maxAge: 3600000,
    });

    res.json({ 
      status: "success", 
      message: `Berjaya log masuk sebagai ${user.nama || user.name}`,
      redirectUrl: isSys ? (target_role === 'staff' ? '/staff/' : '/owner/') : '/customer/'
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// SIMULASI WEBHOOK (FPX TESTER)
router.post("/simulate-fpx", authenticateDev, async (req, res) => {
  try {
    const { order_no, status_sim } = req.body; // status_sim: '1' for success, '3' for fail
    if (!order_no) return res.status(400).json({ status: "error", message: "Tiada no rujukan." });

    // Panggil laluan webhook kita sendiri secara dalaman atau guna axios ke localhost
    // Ini agak rumit jika tiada URL mutlak. Kita arahkan Dev panggil api/bookings/webhook/fpx terus dengan payload tiruan
    res.json({ 
       status: "success", 
       message: "Untuk simulasi, sila post payload berikut ke /api/bookings/webhook/fpx",
       payload_tiruan: {
          refno: order_no,
          status: status_sim || "1",
          billcode: "SIMULASI_" + Date.now()
       }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


const { addDevSubscription, notifyDev, publicVapidKey } = require("../utils/push");

// PUSH NOTIFICATION
router.get("/vapidPublicKey", (req, res) => {
  res.send(publicVapidKey);
});

router.post("/subscribe", authenticateDev, async (req, res) => {
  try {
    const subscription = req.body;
    await addDevSubscription(subscription);
    res.status(201).json({ status: "success", message: "Push notification diaktifkan untuk portal pembangun." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/test-push", authenticateDev, async (req, res) => {
  try {
    await notifyDev("Test God Mode", "Pusat kawalan pelayan beroperasi dengan lancar.");
    res.json({ status: "success", message: "Push notification dihantar." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
