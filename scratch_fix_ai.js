const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

// We need to move the prompt generation and early return to the very beginning of the function
// right after `if (!container) return;`

// 1. Remove it from its original place
js = js.replace(/const timeLabels = \{[\s\S]*?window\.lastInsightPrompt = bgPrompt;/m, '');

// 2. Insert it at the top
const newTop = `
    const timeLabels = {
      daily: "Hari Ini",
      weekly: "Minggu Ini",
      monthly: "Bulan Ini",
      yearly: "Tahun Ini",
      all: "Semua Masa",
    };
    const timeframe = timeLabels[filterType] || "Semua Masa";
    const bgPrompt = \`Sebagai penganalisis perniagaan Dinspire, berikan rumusan eksekutif yang sangat padat (maksimum 3 ayat pendek) berdasarkan data \${timeframe} ini: Jumlah Keseluruhan Jualan RM\${totalSales}, Jumlah Pelanggan Servis \${totalServis} (Pecahan -> Walk-in: \${walkin}, Booking: \${booking}, Rawatan: \${rawatan}, OnCall: \${oncall}). Nyatakan sama ada prestasi baik/buruk secara ringkas, dan selitkan satu nasihat operasi ringkas. Terus kepada inti pati, jangan guna tajuk besar.\`;

    if (window.lastInsightPrompt === bgPrompt) return;
    window.lastInsightPrompt = bgPrompt;
`;

js = js.replace('if (!container) return;', 'if (!container) return;' + newTop);

fs.writeFileSync('public/js/owner.js', js);
console.log("Fixed early return logic in fetchDashboardInsights.");
