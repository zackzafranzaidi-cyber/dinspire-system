const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

js = js.replace(/document\.getElementById\("val-walkin-booking"\)\.innerText\s*=\s*`\$\{countHcWalkin\} \/ \$\{countHcBooking\}`;/, 'document.getElementById("val-walkin-booking").innerText = `${countHcWalkin} Walk-in / ${countHcBooking} Booking`;');

fs.writeFileSync('public/js/owner.js', js);
console.log("Updated walk-in booking text format");
