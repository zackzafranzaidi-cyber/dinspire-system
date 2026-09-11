const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newUpdateBadges = `function updateOwnerBadges() {
    if (typeof masterData === "undefined" || !masterData) return;
    
    let totalSelesai = 0;
    if (masterData.bookings) {
        masterData.bookings.forEach(b => {
            if (b.Status === "Selesai") totalSelesai++;
        });
    }
    let seenSelesai = parseInt(localStorage.getItem('din_seen_tx_servis_count')) || 0;
    window.newSelesaiCount = Math.max(0, totalSelesai - seenSelesai);

    let countTxProduk = 0;
    if (masterData.orders) {
        masterData.orders.forEach(o => {
           if (o.status === "Pending Verification" || o.status === "Preparing") countTxProduk++;
        });
    }

    let countKecemasan = 0;
    if (masterData.staffLeaves) {
        masterData.staffLeaves.forEach(l => {
           if (l.jenis_cuti === "Kecemasan" && l.status === "Pending") countKecemasan++;
        });
    }

    let countReviews = 0;
    if (masterData.reviews) countReviews = masterData.reviews.length;
    let seenReviewsCount = parseInt(localStorage.getItem('din_seen_reviews_count')) || 0;
    let hasNewReviews = countReviews > seenReviewsCount;

    let waClickedRaw = localStorage.getItem('din_wa_clicked_phones');
    window.waClicked = waClickedRaw ? JSON.parse(waClickedRaw) : [];
    let countWaNew = 0;
    if (typeof marketingCustomers !== "undefined" && marketingCustomers && marketingCustomers.length > 0) {
        marketingCustomers.forEach(c => {
            if (!window.waClicked.includes(c.phone)) countWaNew++;
        });
    }

    const updateBadgeNumber = (id, count) => {
       const el = document.getElementById(id);
       if (el) {
          if (count > 0) {
             el.innerText = count > 99 ? "99+" : count;
             el.style.display = "inline-block";
          } else {
             el.style.display = "none";
          }
       }
    };
    
    const updateBadgeDot = (id, hasItem) => {
       const el = document.getElementById(id);
       if (el) {
          el.style.display = hasItem ? "inline-block" : "none";
       }
    };
    
    updateBadgeNumber("badge-tx-servis", window.newSelesaiCount);
    updateBadgeNumber("badge-tx-produk", countTxProduk);
    updateBadgeNumber("badge-punch-kecemasan", countKecemasan);
    updateBadgeNumber("badge-rev-list", hasNewReviews ? (countReviews - seenReviewsCount) : 0);
    updateBadgeNumber("badge-rev-marketing", countWaNew);
    
    updateBadgeDot("badge-mob-transactions", (window.newSelesaiCount > 0 || countTxProduk > 0));
    updateBadgeDot("badge-mob-reviews", (hasNewReviews || countWaNew > 0));
    updateBadgeDot("badge-mob-punch", countKecemasan > 0);
}`;

code = code.replace(/function updateOwnerBadges\(\)\s*\{[\s\S]*?(?=\n$|$)/, newUpdateBadges + '\n');
fs.writeFileSync('public/js/owner.js', code);
