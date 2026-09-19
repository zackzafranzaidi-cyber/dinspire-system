const jwt = require("jsonwebtoken");

function authenticateDev(req, res, next) {
  const tokenDev = req.cookies.din_token_dev;

  if (!tokenDev) {
    return res.status(401).json({ status: "error", message: "Akses Ditolak: Tiada Kunci Pembangun" });
  }

  // Check blacklist
  if (global.jwtBlacklist && global.jwtBlacklist.has(tokenDev)) {
    return res.status(401).json({ status: "error", message: "Sesi Pembangun Ditamatkan." });
  }

  try {
    const decoded = jwt.verify(tokenDev, process.env.JWT_SECRET_DEV || "dev-secret-fallback-if-not-set-danger");
    if (decoded.role !== "developer") {
      throw new Error("Invalid role");
    }
    req.devUser = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ status: "error", message: "Akses Ditolak: Token Tidak Sah" });
  }
}

module.exports = { authenticateDev };
