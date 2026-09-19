const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const { authenticateDev } = require("../middleware/devAuth");

// 1. BACKUP DATA (STREAMING)
router.get("/backup", authenticateDev, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=dinspire_master_backup_' + Date.now() + '.json');
  
  try {
    // Tulis pembukaan JSON
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

      // Loop pagination to handle massive tables without RAM overload
      let hasMore = true;
      let offset = 0;
      const limit = 1000;
      
      res.write('[');
      let isFirstRow = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .range(offset, offset + limit - 1);

        if (error) throw error;

        for (let row of data) {
          if (!isFirstRow) res.write(',');
          res.write(JSON.stringify(row));
          isFirstRow = false;
        }

        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }
      
      res.write(']');
      if (i < tables.length - 1) {
        res.write(',\n');
      } else {
        res.write('\n');
      }
    }

    res.write('}\n}\n');
    res.end();
  } catch (error) {
    // If error happens mid-stream, we just terminate with error msg
    res.write('\n\n"ERROR_ENCOUNTERED": ' + JSON.stringify(error.message) + '\n}');
    res.end();
  }
});

// 2. 3-TIER FACTORY RESET
router.post("/factory-reset", authenticateDev, async (req, res) => {
  try {
    const { confirmation_text, otp } = req.body;
    
    if (confirmation_text !== "DELETE-ALL-DINSPIRE-DATA") {
      return res.status(403).json({ status: "error", message: "Teks Pengesahan Salah." });
    }
    
    // In real prod, verify OTP via authenticator logic. 
    // For now, we enforce a static fallback or `.env` dev passcode.
    if (otp !== process.env.DEV_PASSWORD_HASH) { // Re-using DEV password as OTP for now
       return res.status(403).json({ status: "error", message: "OTP / Katalaluan Tidak Sah." });
    }

    // Deletion Order (Child to Parent) to avoid Foreign Key errors
    const deleteOrder = [
      "reviews", "walkin_records", "oncall_records", "treatment_records", "booking_records", 
      "punch_cards", "products", "treatments", "haircuts", 
      "customers", "staff", "branches", "historical_sales"
    ];

    for (let table of deleteOrder) {
      await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Dirty trick to delete all rows in Supabase REST
    }

    res.json({ status: "success", message: "Pangkalan data telah dikosongkan sepenuhnya." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 3. PRUNE TRIGGER (Arkib Manual)
const { runDailyCleanup } = require("../server.js"); // Wait, we can't require server.js easily without circular dependency if we're not careful.
// Let's implement the trigger safely inside server.js instead or re-implement logic.

module.exports = router;
