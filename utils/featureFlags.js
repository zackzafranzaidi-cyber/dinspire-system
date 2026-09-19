const supabase = require("../config/db");

// Default Flags Fallback
global.featureFlags = {
  customer_portal: true,
  staff_portal: true,
  owner_portal: true,
  booking: true,
  ecommerce: true,
  oncall: true,
  ai: true,
  maintenance_mode: false // Master switch
};

async function initFeatureFlags() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("setting_value")
      .eq("setting_key", "feature_flags")
      .maybeSingle();

    if (error) throw error;

    if (data && data.setting_value) {
      const parsed = JSON.parse(data.setting_value);
      global.featureFlags = { ...global.featureFlags, ...parsed };
      console.log("[SISTEM] Feature Flags dimuat turun dari pangkalan data.");
    } else {
      // Create if not exists
      await supabase.from("settings").insert({
        setting_key: "feature_flags",
        setting_value: JSON.stringify(global.featureFlags)
      });
      console.log("[SISTEM] Feature Flags lalai (default) diwujudkan.");
    }
  } catch (error) {
    console.error("[RALAT] Gagal mengambil Feature Flags:", error.message);
  }
}

// Middleware to check flags
function checkFlag(flagName) {
  return (req, res, next) => {
    // Whitelist bypass for webhooks
    if (req.originalUrl.includes("/api/bookings/webhook/fpx")) {
      return next();
    }

    if (global.featureFlags.maintenance_mode === true) {
      return res.status(503).json({
        status: "error",
        message: "Sistem Sedang Diselenggara (Maintenance Mode). Sila cuba sebentar lagi."
      });
    }

    if (global.featureFlags[flagName] === false) {
      return res.status(403).json({
        status: "error",
        message: `Fungsi ini (${flagName}) ditutup sementara oleh Pembangun.`
      });
    }
    
    next();
  };
}

module.exports = { initFeatureFlags, checkFlag };
