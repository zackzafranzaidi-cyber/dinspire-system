const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

// 1. Total Revenue %
html = html.replace(
  '<span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1"><i class="fas fa-arrow-up mr-1"></i>vs. last period</span>',
  '<span id="val-revenue-pct-container" class="text-xs font-bold px-2 py-1 rounded-md mb-1 bg-gray-100 text-gray-500"><span id="val-revenue-pct">-</span> vs. last <span id="val-revenue-period">month</span></span>'
);

// 2. Orders (Total Service) %
// Before: <p class="text-[10px] text-purple-600 font-bold" id="val-walkin-booking">0 Walk-in / 0 Booking</p>
// Change to include both
html = html.replace(
  '<p class="text-[10px] text-purple-600 font-bold" id="val-walkin-booking">0 Walk-in / 0 Booking</p>',
  '<div class="flex items-center gap-2 mt-1"><span id="val-orders-pct-container" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" id="val-orders-pct">-</span><p class="text-[10px] text-purple-600 font-bold" id="val-walkin-booking">0 Walk-in / 0 Booking</p></div>'
);
// fix duplicate id
html = html.replace('id="val-orders-pct-container" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" id="val-orders-pct"', 'id="val-orders-pct-container" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"><span id="val-orders-pct">-</span>');

// 3. Net Profit %
// Before: <p class="text-[10px] text-emerald-600 font-bold"><i class="fas fa-arrow-up mr-1"></i>Healthy</p>
html = html.replace(
  '<p class="text-[10px] text-emerald-600 font-bold"><i class="fas fa-arrow-up mr-1"></i>Healthy</p>',
  '<span id="val-profit-pct-container" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 self-start"><span id="val-profit-pct">-</span></span>'
);

// 4. Time selectors for Branch chart
const branchChartHeaderOld = `<button class="px-3 py-1.5 rounded-md text-purple-700 bg-white shadow-sm border border-gray-200 transition">Revenue</button>
                <button class="px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-900 transition">Expense</button>
                <button class="px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-900 transition">Profit</button>`;
const branchChartHeaderNew = `<button id="btn-branch-revenue" onclick="setBranchMetric('revenue')" class="px-3 py-1.5 rounded-md text-purple-700 bg-white shadow-sm border border-gray-200 transition">Revenue</button>
                <button id="btn-branch-expense" onclick="setBranchMetric('expense')" class="px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-900 transition">Expense</button>
                <button id="btn-branch-profit" onclick="setBranchMetric('profit')" class="px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-900 transition">Profit</button>`;
html = html.replace(branchChartHeaderOld, branchChartHeaderNew);

fs.writeFileSync('public/owner/index.html', html);
console.log("Updated HTML with IDs for percentages and branch metric buttons.");
