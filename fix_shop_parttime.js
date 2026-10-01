const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

const oldB = 'Barbers: (stData || []).filter((s) => s.jenis_staf === "In-Branch" && !String(s.username).toUpperCase().includes("(BERHENTI)"))';
const newB = 'Barbers: (stData || []).filter((s) => s.jenis_staf === "In-Branch" && s.status_pekerja !== "part_time" && !String(s.username).toUpperCase().includes("(BERHENTI)"))';

const oldO = 'OnCallBarbers: (stData || []).filter((s) => s.jenis_staf === "On-Call" && !String(s.username).toUpperCase().includes("(BERHENTI)"))';
const newO = 'OnCallBarbers: (stData || []).filter((s) => s.jenis_staf === "On-Call" && s.status_pekerja !== "part_time" && !String(s.username).toUpperCase().includes("(BERHENTI)"))';

shop = shop.replace(oldB, newB);
shop = shop.replace(oldO, newO);

fs.writeFileSync('routes/shop.js', shop);
console.log("Excluded part_time from bookings in shop.js");
