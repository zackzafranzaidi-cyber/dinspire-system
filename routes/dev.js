const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
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

module.exports = router;
