const jwt = require("jsonwebtoken");
const supabase = require("../config/db");

// Simple in-memory cache to prevent spamming DB on every request (60s TTL)
const userSessionCache = new Map();

function authenticate(req, res, next) {
  const tokenSys = req.cookies.din_token_sys;
  const tokenClient = req.cookies.din_token_client;

  req.users = {};

  if (tokenSys) {
    if (global.jwtBlacklist && global.jwtBlacklist.has(tokenSys)) {
      return res.status(401).json({ status: "error", message: "Sesi telah ditamatkan (Logged Out)." });
    }
    try {
      req.users.sys = jwt.verify(tokenSys, process.env.JWT_SECRET_SYS);
    } catch (e) {}
  }

  if (tokenClient) {
    if (global.jwtBlacklist && global.jwtBlacklist.has(tokenClient)) {
      return res.status(401).json({ status: "error", message: "Sesi telah ditamatkan (Logged Out)." });
    }
    try {
      req.users.client = jwt.verify(tokenClient, process.env.JWT_SECRET_CLIENT);
    } catch (e) {}
  }

  if (!req.users.sys && !req.users.client) {
    return res.status(401).json({ status: "error", message: "Sesi log masuk tamat. Sila log masuk semula." });
  }
  next();
}

function requireRole(allowedRoles) {
  return async (req, res, next) => {
    let validUser = null;
    let tokenType = null;

    if (req.users.sys && allowedRoles.includes(req.users.sys.role)) {
      validUser = req.users.sys;
      tokenType = "sys";
    } else if (req.users.client && allowedRoles.includes(req.users.client.role)) {
      validUser = req.users.client;
      tokenType = "client";
    }

    if (!validUser) {
      return res.status(403).json({ status: "error", message: "Akses Ditolak: Anda tidak mempunyai kebenaran." });
    }

    // [DIBAIKI] DB Session Validation (Halang Token Berhantu / Ghost Sessions)
    const now = Date.now();
    const cacheKey = `${validUser.role}_${validUser.id}`;
    let isSessionValid = false;

    if (userSessionCache.has(cacheKey) && now - userSessionCache.get(cacheKey).time < 60000) {
      isSessionValid = userSessionCache.get(cacheKey).valid;
    } else {
      try {
        let tableName = "customers";
        if (validUser.role === "staff") tableName = "staff";
        else if (validUser.role === "owner") tableName = "owners";
        else if (validUser.role === "admin") tableName = "admins";

        // Query db to check if user still exists
        const { data } = await supabase.from(tableName).select("id").eq("id", validUser.id).maybeSingle();
        isSessionValid = !!data;
        userSessionCache.set(cacheKey, { valid: isSessionValid, time: now });
      } catch (e) {
        // If DB fails, default to allowing if token is valid to prevent outage
        isSessionValid = true; 
      }
    }

    if (!isSessionValid) {
      // Force logout
      if (tokenType === "sys" && global.jwtBlacklist && req.cookies.din_token_sys) {
         global.jwtBlacklist.set(req.cookies.din_token_sys, true);
      } else if (tokenType === "client" && global.jwtBlacklist && req.cookies.din_token_client) {
         global.jwtBlacklist.set(req.cookies.din_token_client, true);
      }
      return res.status(401).json({ status: "error", message: "Akaun anda telah dipadam atau diubah. Sila log masuk semula." });
    }

    req.user = validUser;
    next();
  };
}

module.exports = { authenticate, requireRole };
