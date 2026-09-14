const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const replacement = `      // [DIBAIKI] Caching Tempatan (Optimistic Load) untuk PWA
      localStorage.setItem("din_owner_dashboard", JSON.stringify(data)); // Simpan ke cache tempatan
      masterData = data.masterData;
      mapBarberBranch = data.mapBarberBranch || {};
      if (!masterData.orders) masterData.orders = [];
      if (!masterData.bookings) masterData.bookings = [];
      
      // Fetch marketing data silently to populate badges
      await fetchMarketingData(true);
      
      processData();`;

code = code.replace(/localStorage\.setItem\("din_owner_dashboard"[\s\S]*?processData\(\);/, replacement);
fs.writeFileSync('public/js/owner.js', code);
