const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

// ==========================================
// LIMITER
// ==========================================
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { status: "error", message: "Terlalu banyak permintaan OTP." },
});

const loginAttempts = {};
const otpAttempts = {}; // [DIBAIKI] Brute-Force OTP Tracking

// 2. Had Akses untuk MENGESAHKAN (Meneka) OTP & Log Masuk Sistem
const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message:
      "Terlalu banyak percubaan yang gagal. Akaun disekat sementara, sila cuba lagi selepas 5 minit.",
  },
});

// ==========================================
// LALUAN PELANGGAN (SISTEM OTP)
// ==========================================

router.post("/request-otp", otpLimiter, async (req, res) => {
  const { phone } = req.body;
  const phoneRegex = /^01\d{8,9}$/;
  if (!phoneRegex.test(phone)) {
    return res
      .status(400)
      .json({
        status: "error",
        message: "Format nombor tidak sah. (Cth: 01XXXXXXXX)",
      });
  }

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60000);

  const { error } = await supabase
    .from("otps")
    .upsert([{ phone, otp_code: otpCode, expires_at: expiresAt }], {
      onConflict: "phone",
    });
  if (error)
    return res
      .status(500)
      .json({ status: "error", message: "Ralat pelayan semasa menjana OTP." });

  console.log(`\n========================================`);
  console.log(`[SIMULASI SMS] Hantar ke: ${phone}`);
  console.log(
    `Mesej: Kod OTP Dinspire anda ialah ${otpCode}. Sah untuk 5 minit.`,
  );
  console.log(`========================================\n`);

  res.json({
    status: "success",
    message: "Kod OTP telah dihantar. Sila semak peti masuk anda.",
  });
});

router.post("/register", verifyLimiter, async (req, res) => {
  try {
    const { username, phone, address, avatar_url, otp, password } = req.body;
    
    // [DIBAIKI] Type Confusion DoS & Stored XSS Prevention
    const safeUsernameStr = String(username || "");
    const safeAddressStr = String(address || "");
    const safePhoneStr = String(phone || "");
    
    const xssRegex = /<[^>]*>?/gm;
    if (xssRegex.test(safeUsernameStr) || xssRegex.test(safeAddressStr)) {
      return res.status(400).json({ status: "error", message: "Kandungan tidak sah. Sila buang simbol berbahaya." });
    }
    
    // Had panjang maksima
    const safeUsername = safeUsernameStr.substring(0, 100).replace(/<[^>]*>?/gm, "");
    const safeAddress = safeAddressStr.substring(0, 255).replace(/<[^>]*>?/gm, "");
    const safePhone = safePhoneStr.substring(0, 20);

    if (!password || password.length < 6 || password.length > 72) {
      return res.status(400).json({ status: "error", message: "Kata laluan mestilah antara 6 hingga 72 aksara." });
    }

    const { data: existUser } = await supabase.from("customers").select("id").eq("phone", phone).single();
    if (existUser) {
      return res.status(400).json({ status: "error", message: "Nombor telefon ini sudah didaftarkan." });
    }

    // Semak OTP di jadual baharu 'otps'
    const { data: otpRecord } = await supabase
      .from("otps")
      .select("*")
      .eq("phone", phone)
      .eq("otp_code", otp)
      .single();
    if (!otpRecord)
      return res
        .status(400)
        .json({ status: "error", message: "Kod OTP salah atau tidak wujud." });
    if (new Date(otpRecord.expires_at) < new Date())
      return res
        .status(400)
        .json({ status: "error", message: "Kod OTP telah tamat tempoh." });

    // Semak jika pelanggan wujud di jadual 'customers'
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone);
    if (existing && existing.length > 0)
      return res
        .status(400)
        .json({
          status: "error",
          message: "Nombor telefon ini sudah didaftarkan.",
        });

    const password_hash = await bcrypt.hash(password, 10);
    const { error } = await supabase.from("customers").insert([
      {
        name: safeUsername,
        phone: safePhone,
        address: safeAddress,
        avatar_url,
        password_hash,
      },
    ]);if (error) {
      console.error("REGISTER ERROR:", error);
      return res
        .status(500)
        .json({
          status: "error",
          message: "Gagal mendaftar pelanggan. Sila cuba lagi.",
        });
    }

    await supabase.from("otps").delete().eq("phone", phone);
    res.json({
      status: "success",
      message: "Pendaftaran berjaya! Sila log masuk.",
    });
  } catch (err) {
    require('fs').writeFileSync('crash.txt', err.stack);
    console.error("UNCAUGHT EXCEPTION IN /REGISTER:", err);
    res.status(500).json({ status: "error", message: "Ralat sistem: Pendaftaran tergendala seketika." });
  }
});

router.post("/login", verifyLimiter, async (req, res) => {
  const { phone, password, remember } = req.body;
  if (!password) {
    return res.status(400).json({ status: "error", message: "Sila masukkan kata laluan." });
  }

  if (loginAttempts[phone] && loginAttempts[phone] > 10) {
    return res.status(429).json({ status: "error", message: "Akaun dikunci sementara akibat terlalu banyak percubaan gagal." });
  }

  try {
    const { data: user } = await supabase.from("customers").select("*").eq("phone", phone).single();
    if (!user) {
      // [DIBAIKI] Timing Attack Protection (Dummy Hashing)
      await bcrypt.compare(password, "$2b$10$DummyHash12345678901234567890123456789012345678901234");
      return res.status(404).json({
        status: "error",
        message: "Akaun tidak dijumpai. Sila daftar dahulu.",
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash || "");
    if (!isValid) {
      loginAttempts[phone] = (loginAttempts[phone] || 0) + 1;
      return res.status(401).json({ status: "error", message: "Kata laluan salah." });
    }

    loginAttempts[phone] = 0;

    const token = jwt.sign(
      { id: user.id, role: "customer" },
      process.env.JWT_SECRET_CLIENT,
      { expiresIn: "1h", iss: "dinspire-sys" }, // [DIBAIKI] Zero-Trust Boundary & JWT Expiry
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict", // [DIBAIKI] Mengurangkan risiko CSRF
    };

    if (remember) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.cookie("din_token_client", token, cookieOptions);

    delete user.password_hash;
    res.json({ status: "success", user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ status: "error", message: "Ralat sistem log masuk." });
  }
});

// ==========================================
// LALUAN LUPA KATA LALUAN
// ==========================================

router.post("/forgot-password/request-otp", otpLimiter, async (req, res) => {
  const { phone } = req.body;
  const { data: user } = await supabase.from("customers").select("id").eq("phone", phone).single();
  if (!user) {
    return res.status(404).json({ status: "error", message: "Akaun dengan nombor telefon ini tidak wujud." });
  }

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60000);
  await supabase.from("otps").upsert([{ phone, otp_code: otpCode, expires_at: expiresAt }], { onConflict: "phone" });

  console.log(`\n========================================`);
  console.log(`[SIMULASI SMS - LUPA KATA LALUAN] Hantar ke: ${phone}`);
  console.log(`Mesej: Kod OTP tetapan semula kata laluan anda ialah ${otpCode}.`);
  console.log(`========================================\n`);

  res.json({ status: "success", message: "Kod OTP telah dihantar untuk menetapkan semula kata laluan." });
});

router.post("/forgot-password/reset", verifyLimiter, async (req, res) => {
  const { phone, otp, new_password } = req.body;
  
  if (otpAttempts[phone] && otpAttempts[phone] > 3) {
    return res.status(429).json({ status: "error", message: "Terlalu banyak percubaan salah. Sila mohon OTP baharu." });
  }

  const { data: otpRecord } = await supabase.from("otps").select("*").eq("phone", phone).eq("otp_code", String(otp)).single();
  
  if (!otpRecord) {
    // [DIBAIKI] Infinite OTP Brute-Force Protection
    otpAttempts[phone] = (otpAttempts[phone] || 0) + 1;
    if (otpAttempts[phone] > 3) await supabase.from("otps").delete().eq("phone", phone);
    return res.status(400).json({ status: "error", message: "Kod OTP salah atau tidak wujud." });
  }
  
  // Jika betul, padam dari DB
  await supabase.from("otps").delete().eq("phone", phone);
  otpAttempts[phone] = 0;

  if (new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ status: "error", message: "Kod OTP tamat tempoh." });

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ status: "error", message: "Kata laluan mestilah sekurang-kurangnya 6 aksara." });
  }

  const password_hash = await bcrypt.hash(new_password, 10);
  await supabase.from("customers").update({ password_hash }).eq("phone", phone);

  res.json({ status: "success", message: "Kata laluan telah berjaya ditetapkan semula. Sila log masuk." });
});

// ==========================================
// LALUAN SISTEM (ADMIN, OWNER, STAFF)
// ==========================================

router.post("/system-login", verifyLimiter, async (req, res) => {
  try {
    const { username, password, allowed_roles, remember } = req.body;
    
    // [DIBAIKI] Type Confusion DoS HPP
    const safeUsername = String(username || "");

    if (!safeUsername || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Sila lengkapkan semua medan." });
    }

    if (loginAttempts[safeUsername] && loginAttempts[safeUsername] > 10) {
      return res.status(429).json({ status: "error", message: "Akaun dikunci sementara akibat terlalu banyak percubaan gagal." });
    }

    let user = null;
    let roleFound = null;

    // 1. Semak secara berhierarki bermula dari jawatan tertinggi
    // Cari dalam jadual 'owners'
    let { data: owner } = await supabase
      .from("owners")
      .select("*")
      .eq("username", safeUsername)
      .single();
    if (owner) {
      user = owner;
      roleFound = "owner";
    }

    // 2. Cari dalam jadual 'admins'
    if (!user) {
      let { data: admin } = await supabase
        .from("admins")
        .select("*")
        .eq("username", safeUsername)
        .single();
      if (admin) {
        user = admin;
        roleFound = "admin";
      }
    }

    // 3. Cari dalam jadual 'staff'
    if (!user) {
      let { data: staff } = await supabase
        .from("staff")
        .select("*")
        .eq("username", safeUsername)
        .single();
      if (staff) {
        user = staff;
        roleFound = "staff";
      }
    }

    // Jika tiada rekod dalam mana-mana jadual
    if (!user) {
      // [DIBAIKI] Timing Attack Protection (Dummy Hashing)
      await bcrypt.compare(password, "$2b$10$DummyHash12345678901234567890123456789012345678901234");
      return res
        .status(401)
        .json({ status: "error", message: "Akaun tidak wujud." });
    }

    // Semak pengesahan kata laluan (Hashing)
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      loginAttempts[safeUsername] = (loginAttempts[safeUsername] || 0) + 1;
      return res
        .status(401)
        .json({
          status: "error",
          message: "Akses ditolak. Kata laluan salah.",
        });
    }

    loginAttempts[safeUsername] = 0;

    // Keselamatan Tambahan: Pastikan jawatan sebenar staf ini DIBENARKAN untuk masuk ke portal yang sedang dibuka
    if (allowed_roles && Array.isArray(allowed_roles)) {
      if (!allowed_roles.includes(roleFound)) {
        return res.status(403).json({
          status: "error",
          message: `Akses ditolak. Jawatan anda (${roleFound.toUpperCase()}) tidak dibenarkan masuk ke portal ini.`,
        });
      }
    }

    // Sediakan Data JWT dengan jawatan tulen dari pangkalan data
    const jwtPayload = {
      id: user.id,
      username: user.username,
      role: roleFound,
    };
    if (roleFound === "staff") {
      jwtPayload.jenis_staf = user.jenis_staf;
    }

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET_SYS, {
      expiresIn: remember ? "30d" : "12h",
      iss: "dinspire-sys" // [DIBAIKI] Zero-Trust Boundary
    });
    delete user.password_hash;

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict", // [DIBAIKI] Mengurangkan risiko CSRF
    };
    
    if (remember) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.cookie("din_token_sys", token, cookieOptions);

    res.json({ status: "success", user: { ...user, role: roleFound } });
  } catch (error) {
    console.error("Ralat log masuk sistem:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: "Ralat pelayan. Sila hubungi teknikal.",
      });
  }
});

// ==========================================
// LALUAN LOG KELUAR
// ==========================================

router.post("/logout-client", (req, res) => {
  const token = req.cookies.din_token_client;
  if (token && global.jwtBlacklist) global.jwtBlacklist.set(token, Date.now());

  res.clearCookie("din_token_client", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
  res.json({ status: "success", message: "Pelanggan telah log keluar." });
});

router.post("/logout-sys", (req, res) => {
  const token = req.cookies.din_token_sys;
  if (token && global.jwtBlacklist) global.jwtBlacklist.set(token, Date.now());

  res.clearCookie("din_token_sys", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
  res.json({ status: "success", message: "Staf/Owner telah log keluar." });
});

module.exports = router;
