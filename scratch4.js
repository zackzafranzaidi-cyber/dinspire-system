const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newToggleTxTab = `function toggleTxTab(type) {
  document.getElementById("tx-servis-view").classList.add("hidden");
  document.getElementById("tx-produk-view").classList.add("hidden");
  document.getElementById("tx-" + type + "-view").classList.remove("hidden");
  
  if (type === 'servis') {
     let totalSelesai = 0;
     if (typeof masterData !== "undefined" && masterData.bookings) {
         masterData.bookings.forEach(b => { if (b.Status === "Selesai") totalSelesai++; });
     }
     localStorage.setItem('din_seen_tx_servis_count', totalSelesai);
     updateOwnerBadges();
     document.querySelectorAll('.servis-new-dot').forEach(el => el.style.display = 'none');
  }
}`;

code = code.replace(/function toggleTxTab\(type\)\s*\{[\s\S]*?(?=\nfunction togglePunchTab)/, newToggleTxTab + '\n');

const newToggleRevTab = `function toggleRevTab(tab) {
  document.getElementById("rev-list-view").classList.add("hidden");
  document.getElementById("rev-marketing-view").classList.add("hidden");

  if (tab === "reviews") {
    document.getElementById("rev-list-view").classList.remove("hidden");
    if (typeof masterData !== "undefined" && masterData.reviews) {
        localStorage.setItem('din_seen_reviews_count', masterData.reviews.length);
    }
    updateOwnerBadges();
    document.querySelectorAll('.review-new-dot').forEach(el => el.style.display = 'none');
  } else if (tab === "marketing") {
    document.getElementById("rev-marketing-view").classList.remove("hidden");
    if (typeof marketingCustomers !== "undefined" && marketingCustomers) {
        localStorage.setItem('din_seen_wa_count', marketingCustomers.length);
    }
    updateOwnerBadges();
    fetchMarketingData();
  }
}`;

code = code.replace(/function toggleRevTab\(tab\)\s*\{[\s\S]*?(?=\nlet marketingCustomers)/, newToggleRevTab + '\n');

fs.writeFileSync('public/js/owner.js', code);
