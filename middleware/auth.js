const jwt = require("jsonwebtoken");

// 1. Middleware Pertama: Semak & Simpan Kedua-dua Token
function authenticate(req, res, next) {
  const tokenSys = req.cookies.din_token_sys;
  const tokenClient = req.cookies.din_token_client;

  req.users = {}; // Objek untuk simpan kedua-dua identiti jika ada

  // [DIBAIKI] Guna Kunci Khas Sistem
  if (tokenSys) {
    if (global.jwtBlacklist && global.jwtBlacklist.has(tokenSys)) {
      // Token ini sudah dibatalkan (Logged Out)
    } else {
      try {
        req.users.sys = jwt.verify(tokenSys, process.env.JWT_SECRET_SYS);
      } catch (e) {}
    }
  }

  // [DIBAIKI] Guna Kunci Khas Pelanggan
  if (tokenClient) {
    if (global.jwtBlacklist && global.jwtBlacklist.has(tokenClient)) {
      // Token ini sudah dibatalkan (Logged Out)
    } else {
      try {
        req.users.client = jwt.verify(tokenClient, process.env.JWT_SECRET_CLIENT);
      } catch (e) {}
    }
  }

  if (!req.users.sys && !req.users.client) {
    return res
      .status(401)
      .json({
        status: "error",
        message: "Sesi log masuk tamat. Sila log masuk semula.",
      });
  }
  next();
}

// 2. Middleware Kedua: Pilih Token yang Tepat Mengikut Peranan (Role)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    let validUser = null;

    if (req.users.sys && allowedRoles.includes(req.users.sys.role)) {
      validUser = req.users.sys;
    } else if (
      req.users.client &&
      allowedRoles.includes(req.users.client.role)
    ) {
      validUser = req.users.client;
    }

    if (!validUser) {
      return res
        .status(403)
        .json({
          status: "error",
          message: "Akses Ditolak: Anda tidak mempunyai kebenaran.",
        });
    }

    req.user = validUser;
    next();
  };
}

module.exports = { authenticate, requireRole };
