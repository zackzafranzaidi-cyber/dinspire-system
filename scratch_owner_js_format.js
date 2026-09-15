const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

js = js.replace('document.getElementById("val-walkin-booking").innerText =\n    `${countHcWalkin} / ${countHcBooking}`;', 'document.getElementById("val-walkin-booking").innerText = `${countHcWalkin} Walk-in / ${countHcBooking} Booking`;');

// Also try to find it on a single line if formatting is different
js = js.replace('document.getElementById("val-walkin-booking").innerText = `${countHcWalkin} / ${countHcBooking}`;', 'document.getElementById("val-walkin-booking").innerText = `${countHcWalkin} Walk-in / ${countHcBooking} Booking`;');

js = js.replace('animateNumber("val-orders-count", productOrderCount, "", "", 0);', 'animateNumber("val-orders-count", productOrderCount, "", " Orders", 0);');

fs.writeFileSync('public/js/owner.js', js);
console.log("Updated owner.js formatting");
