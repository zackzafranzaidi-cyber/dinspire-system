const fs = require('fs');
let code = fs.readFileSync('routes/admin.js', 'utf8');
code = code.replace(
  /catch \(error\) \{\s*res\s*\.status\(500\)\s*\.json\(\{ status: "error", message: "Gagal memuat turun data\." \}\);\s*\}/,
  `catch (error) {
      console.error("[ADMIN DATA ERROR]", error);
      res.status(500).json({ status: "error", message: "Gagal memuat turun data." });
    }`
);
fs.writeFileSync('routes/admin.js', code);
