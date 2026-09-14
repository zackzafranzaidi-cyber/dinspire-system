const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newFetch = `  try {
    const [res, badgeRes] = await Promise.all([
      fetch(\`\${API_BASE_URL}/owner/dashboard\`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }),
      fetch(\`\${API_BASE_URL}/owner/seen-badges\`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).catch(e => null)
    ]);
    
    if (badgeRes && badgeRes.ok) {
       const badgeData = await badgeRes.json();
       if (badgeData && badgeData.status === 'success' && badgeData.badges) {
          if (badgeData.badges.tx_servis !== undefined) localStorage.setItem('din_seen_tx_servis_count', badgeData.badges.tx_servis);
          if (badgeData.badges.tx_produk !== undefined) localStorage.setItem('din_seen_tx_produk_count', badgeData.badges.tx_produk);
          if (badgeData.badges.reviews !== undefined) localStorage.setItem('din_seen_reviews_count', badgeData.badges.reviews);
          if (badgeData.badges.wa !== undefined) localStorage.setItem('din_seen_wa_count', badgeData.badges.wa);
       }
    }`;

code = code.replace(/try\s*\{\s*const res = await fetch\(`\$\{API_BASE_URL\}\/owner\/dashboard`,\s*\{\s*method:\s*"GET",\s*headers:\s*\{\s*"Content-Type":\s*"application\/json"\s*\},\s*credentials:\s*"include",\s*\}\);/, newFetch);
fs.writeFileSync('public/js/owner.js', code);
