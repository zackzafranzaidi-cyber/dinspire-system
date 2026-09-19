const fs = require('fs');
let devJs = fs.readFileSync('routes/dev.js', 'utf8');

const additionalRoutes = `
const { pruneYearlyData } = require("../utils/archiver");

// BACKUP DATA (STREAMING)
router.get("/backup", authenticateDev, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=dinspire_master_backup_' + Date.now() + '.json');
  
  try {
    res.write('{\\n"tarikh_backup": "' + new Date().toISOString() + '",\\n"data": {\\n');
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
      if (i < tables.length - 1) res.write(',\\n');
      else res.write('\\n');
    }
    res.write('}\\n}\\n');
    res.end();
  } catch (error) {
    res.write('\\n\\n"ERROR_ENCOUNTERED": ' + JSON.stringify(error.message) + '\\n}');
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
        if (error) throw new Error(\`Ralat semasa memasukkan jadual \${table}: \${error.message}\`);
      }
    }
    res.json({ status: "success", message: "Sistem berjaya dipulihkan dari sandaran!" });
  } catch (error) {
    // Note: Due to PostgREST limitations, true ROLLBACK across tables isn't supported without RPC.
    // The insert stops at the failed table.
    res.status(500).json({ status: "error", message: "PEMULIHAN GAGAL: " + error.message });
  }
});
`;

devJs = devJs.replace('module.exports = router;', additionalRoutes + '\nmodule.exports = router;');
fs.writeFileSync('routes/dev.js', devJs);
console.log('Added Data Management routes to dev.js');
