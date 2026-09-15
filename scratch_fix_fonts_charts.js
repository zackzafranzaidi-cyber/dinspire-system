const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

// 1. Remove the old duplicate charts
const blockToRemove = `          <!-- CARTA -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="card border border-gray-200 w-full max-w-full">
              <h3
                class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide"
                data-i18n="chart-sales"
              >
                Trend Aliran Tunai
              </h3>
              <div class="relative h-64 w-full">
                <canvas id="salesChart" class="w-full h-full"></canvas>
              </div>
            </div>
            
            <div class="card border border-gray-200 w-full max-w-full">
              <h3
                class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide"
                data-i18n="chart-branch-sales"
              >
                <i class="fas fa-chart-line mr-2 text-gray-500"></i> Trend Jualan Cawangan
              </h3>
              <div class="relative h-64 w-full">
                <canvas id="branchLineChart" class="w-full h-full"></canvas>
              </div>
            </div>
          </div>`;

if (html.includes(blockToRemove)) {
    html = html.replace(blockToRemove, '');
    console.log("Old duplicate charts removed!");
} else {
    // try a more robust regex if exact string matching fails due to formatting
    const regex = /<!-- CARTA -->[\s\S]*?<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">/;
    if (regex.test(html)) {
        html = html.replace(regex, '<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">');
        console.log("Old duplicate charts removed via regex!");
    } else {
        console.log("WARNING: Could not find duplicate charts block.");
    }
}

// 2. Reduce font sizes
html = html.replace('text-3xl md:text-4xl font-black text-gray-900 tracking-tight" id="val-revenue"', 'text-2xl md:text-3xl font-black text-gray-900 tracking-tight" id="val-revenue"');
html = html.replace('text-2xl md:text-3xl font-black text-gray-900 mb-1" id="val-services-count"', 'text-xl md:text-2xl font-black text-gray-900 mb-1" id="val-services-count"');
html = html.replace('text-2xl md:text-3xl font-black text-gray-900 mb-1" id="val-net-profit"', 'text-xl md:text-2xl font-black text-gray-900 mb-1" id="val-net-profit"');
html = html.replace('text-2xl md:text-3xl font-black text-gray-900 mb-1" id="val-commission"', 'text-xl md:text-2xl font-black text-gray-900 mb-1" id="val-commission"');
html = html.replace('text-2xl md:text-3xl font-black text-white mb-1 relative z-10" id="val-sms-balance"', 'text-xl md:text-2xl font-black text-white mb-1 relative z-10" id="val-sms-balance"');
html = html.replace('text-xl md:text-2xl font-black text-gray-900" id="val-products-rm"', 'text-lg md:text-xl font-black text-gray-900" id="val-products-rm"');
html = html.replace('text-3xl md:text-4xl font-black text-gray-900" id="val-rating"', 'text-2xl md:text-3xl font-black text-gray-900" id="val-rating"');

fs.writeFileSync('public/owner/index.html', html);
console.log("Updated HTML with smaller fonts and removed duplicate charts.");
