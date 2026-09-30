const fs = require('fs');
let owner = fs.readFileSync('routes/owner.js', 'utf8');

owner = owner.replace(
    'res.status(500).json({ status: "error", message: "Gagal menyelesaikan permohonan" });',
    'res.status(500).json({ status: "error", message: "Gagal menyelesaikan permohonan: " + (error.message || JSON.stringify(error)) });'
);

fs.writeFileSync('routes/owner.js', owner);
console.log("Added error message to response");
