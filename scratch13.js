const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newToggleTxTab = `function toggleTxTab(type) {
    document.getElementById("tx-servis-view").classList.add("hidden");
    document.getElementById("tx-produk-view").classList.add("hidden");
    document.getElementById("tx-" + type + "-view").classList.remove("hidden");
    
    if (type === 'servis') {
       let totalServis = (typeof masterData !== "undefined" && masterData.bookings) ? masterData.bookings.length : 0;
       localStorage.setItem('din_seen_tx_servis_count', totalServis);
       updateOwnerBadges();
       document.querySelectorAll('.servis-new-dot').forEach(el => el.style.display = 'none');
    }
  }`;

code = code.replace(/function toggleTxTab\(type\)\s*\{[\s\S]*?(?=\n\s*function togglePunchTab)/, newToggleTxTab + '\n');
fs.writeFileSync('public/js/owner.js', code);
