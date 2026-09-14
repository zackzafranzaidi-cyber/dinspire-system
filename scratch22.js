const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

code = code.replace(
/if \(badgeData\.badges\.tx_produk !== undefined\) localStorage\.setItem\('din_seen_tx_produk_count', badgeData\.badges\.tx_produk\); syncSeenBadge\('tx_produk', badgeData\.badges\.tx_produk\);/,
"if (badgeData.badges.tx_produk !== undefined) localStorage.setItem('din_seen_tx_produk_count', badgeData.badges.tx_produk);"
);

code = code.replace(
/if \(badgeData\.badges\.reviews !== undefined\) localStorage\.setItem\('din_seen_reviews_count', badgeData\.badges\.reviews\); syncSeenBadge\('reviews', badgeData\.badges\.reviews\);/,
"if (badgeData.badges.reviews !== undefined) localStorage.setItem('din_seen_reviews_count', badgeData.badges.reviews);"
);

code = code.replace(
/if \(badgeData\.badges\.wa !== undefined\) localStorage\.setItem\('din_seen_wa_count', badgeData\.badges\.wa\); syncSeenBadge\('wa', badgeData\.badges\.wa\);/,
"if (badgeData.badges.wa !== undefined) localStorage.setItem('din_seen_wa_count', badgeData.badges.wa);"
);

fs.writeFileSync('public/js/owner.js', code);
