const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

// Replace tx_servis
code = code.replace(/localStorage\.setItem\('din_seen_tx_servis_count',\s*totalServis\);/g, "localStorage.setItem('din_seen_tx_servis_count', totalServis); syncSeenBadge('tx_servis', totalServis);");

// Replace tx_produk
// Let's check if tx_produk is used
code = code.replace(/localStorage\.setItem\('din_seen_tx_produk_count',\s*([^)]+)\);/g, "localStorage.setItem('din_seen_tx_produk_count', $1); syncSeenBadge('tx_produk', $1);");

// Replace reviews
code = code.replace(/localStorage\.setItem\('din_seen_reviews_count',\s*([^)]+)\);/g, "localStorage.setItem('din_seen_reviews_count', $1); syncSeenBadge('reviews', $1);");

// Replace wa
code = code.replace(/localStorage\.setItem\('din_seen_wa_count',\s*([^)]+)\);/g, "localStorage.setItem('din_seen_wa_count', $1); syncSeenBadge('wa', $1);");

fs.writeFileSync('public/js/owner.js', code);
