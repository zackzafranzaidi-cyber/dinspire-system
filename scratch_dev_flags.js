const fs = require('fs');
let devJs = fs.readFileSync('routes/dev.js', 'utf8');

const flagRoutes = `
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
`;

devJs = devJs.replace('module.exports = router;', flagRoutes + '\nmodule.exports = router;');
fs.writeFileSync('routes/dev.js', devJs);
console.log('Added flag toggle routes to dev.js');
