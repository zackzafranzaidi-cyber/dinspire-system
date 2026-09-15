const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const startTag = '<!-- [BAHARU] AI QUICK INSIGHTS -->';
const endTag = '<!-- CARTA -->';
const startIdx = html.indexOf(startTag);
const endIdx = html.indexOf(endTag);

const newHTML = `<!-- AI QUICK INSIGHTS (REDESIGNED) -->
          <div
            id="ai-quick-insights"
            class="mb-6 bg-gray-900 border border-purple-500/20 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden"
          >
            <!-- Minimal gradient accent -->
            <div class="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="flex flex-col relative z-10 w-full">
              <div
                class="flex flex-row items-center justify-between cursor-pointer group"
                onclick="
                  document.getElementById('ai-insights-content').classList.toggle('hidden');
                  document.getElementById('ai-chevron').classList.toggle('rotate-180');
                "
              >
                <div class="flex items-center gap-2 md:gap-3">
                  <i class="fas fa-sparkles text-purple-400 text-sm"></i>
                  <h3 class="text-white font-bold tracking-widest uppercase text-[10px] md:text-xs" data-i18n="ai-insights-title">
                    AI Quick Insights
                  </h3>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    id="ai-insights-status"
                    class="text-[9px] md:text-[10px] text-purple-300 font-bold tracking-widest uppercase bg-purple-900/30 px-2 py-1 rounded border border-purple-500/20"
                    ><i class="fas fa-spinner fa-spin mr-1"></i
                    >Menganalisis...</span>
                  <i id="ai-chevron" class="fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200"></i>
                </div>
              </div>
              <div
                id="ai-insights-content"
                class="mt-3 text-gray-300 text-xs md:text-sm leading-relaxed hidden flex-col w-full break-words whitespace-normal"
              >
                <div class="w-full space-y-2">
                  <div class="h-2 bg-gray-800 rounded w-full animate-pulse"></div>
                  <div class="h-2 bg-gray-800 rounded w-5/6 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- END AI QUICK INSIGHTS -->

          <!-- LEVEL 1: MAIN REVENUE SECTION -->
          <div class="card border border-gray-200 mb-6 p-5 md:p-6 flex flex-col shadow-sm rounded-2xl bg-white w-full max-w-full">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 class="text-[10px] md:text-xs font-bold text-gray-500 tracking-widest uppercase mb-1" data-i18n="card-quotation">Total Revenue</h2>
                <div class="flex items-end gap-3">
                  <p class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight" id="val-revenue">RM 0</p>
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1"><i class="fas fa-arrow-up mr-1"></i>vs. last period</span>
                </div>
              </div>
              <div class="flex bg-gray-50 border border-gray-100 rounded-lg p-1 text-[10px] font-bold">
                <button class="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-900 transition">7D</button>
                <button class="px-3 py-1.5 rounded-md text-purple-700 bg-white shadow-sm border border-gray-200 transition">30D</button>
                <button class="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-900 transition">3M</button>
                <button class="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-900 transition">1Y</button>
              </div>
            </div>
            
            <div class="relative h-48 md:h-56 w-full">
              <canvas id="salesChart" class="w-full h-full"></canvas>
            </div>
          </div>

          <!-- LEVEL 2: KPI CARDS -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div class="card border border-gray-100 bg-white p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <h3 class="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-3">Total Service</h3>
              <p class="text-2xl md:text-3xl font-black text-gray-900 mb-1" id="val-services-count">0</p>
              <p class="text-[10px] text-purple-600 font-bold" id="val-walkin-booking">0 Walk-in / 0 Booking</p>
            </div>

            <div class="card border border-gray-100 bg-white p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <h3 class="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-3" data-i18n="card-net-profit">Net Profit</h3>
              <p class="text-2xl md:text-3xl font-black text-gray-900 mb-1" id="val-net-profit">RM 0</p>
              <p class="text-[10px] text-emerald-600 font-bold"><i class="fas fa-arrow-up mr-1"></i>Healthy</p>
            </div>

            <div class="card border border-gray-100 bg-white p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <h3 class="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-3" data-i18n="card-commission">Commission</h3>
              <p class="text-2xl md:text-3xl font-black text-gray-900 mb-1" id="val-commission">RM 0</p>
              <p class="text-[10px] text-gray-400 font-bold">Staff Payouts</p>
            </div>

            <div class="card border-none bg-gray-900 p-4 md:p-5 flex flex-col justify-between shadow-md rounded-2xl relative overflow-hidden group">
              <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><i class="fas fa-envelope text-6xl text-white"></i></div>
              <h3 class="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-3 relative z-10" data-i18n="sms-balance-title">SMS Credit</h3>
              <p class="text-2xl md:text-3xl font-black text-white mb-1 relative z-10" id="val-sms-balance">0</p>
              <p class="text-[10px] text-purple-400 font-bold relative z-10">Available Balance</p>
            </div>
          </div>

          <!-- LEVEL 3: SECONDARY KPI -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
            <div class="card border border-gray-100 bg-white p-4 md:p-5 rounded-2xl shadow-sm">
              <h3 class="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-3" data-i18n="card-product">Product Sales</h3>
              <div class="flex justify-between items-end mb-3">
                <p class="text-xl md:text-2xl font-black text-gray-900" id="val-products-rm">RM 0</p>
                <span class="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100" id="val-orders-count">0 Orders</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                <div class="bg-purple-500 h-full rounded-full w-3/4"></div>
              </div>
              <p class="text-[10px] text-gray-400 font-medium text-right"><span class="font-bold text-gray-700" id="val-products-stock">0</span> units in stock</p>
            </div>

            <div class="card border-none bg-purple-50/50 p-4 md:p-5 rounded-2xl shadow-sm">
              <h3 class="text-[9px] md:text-[10px] text-purple-800/60 font-bold tracking-widest uppercase mb-4" data-i18n="card-fees">Collected Fees</h3>
              <div class="flex justify-between items-center mb-3">
                <span class="text-xs font-bold text-purple-900/70" data-i18n="fee-service">Service Fee</span>
                <span class="text-sm font-black text-purple-900" id="val-service-fee">RM 0.00</span>
              </div>
              <div class="flex justify-between items-center border-t border-purple-200/50 pt-3">
                <span class="text-xs font-bold text-purple-900/70" data-i18n="fee-shipping">Shipping Fee</span>
                <span class="text-sm font-black text-purple-900" id="val-shipping-fee">RM 0.00</span>
              </div>
            </div>

            <div class="card border border-gray-100 bg-white p-4 md:p-5 rounded-2xl shadow-sm">
              <h3 class="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-3" data-i18n="card-rating">Average Rating</h3>
              <div class="flex items-center gap-3 mb-2">
                <p class="text-3xl md:text-4xl font-black text-gray-900" id="val-rating">0.0</p>
                <div class="flex text-yellow-400 text-sm">
                  <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                </div>
              </div>
              <p class="text-[10px] text-gray-500 font-medium">Top Branch: <span class="font-bold text-gray-900" id="val-top-branch">-</span></p>
            </div>
          </div>

          <!-- LEVEL 4: CASH FLOW TREND (Branch Line Chart) -->
          <div class="card border border-gray-100 bg-white w-full max-w-full mb-6 p-5 md:p-6 rounded-2xl shadow-sm">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 class="font-bold text-gray-900 text-[10px] md:text-xs uppercase tracking-widest" data-i18n="chart-branch-sales">Cash Flow & Branch Trend</h3>
              <div class="flex bg-gray-50 border border-gray-100 rounded-lg p-1 text-[10px] font-bold">
                <button class="px-3 py-1.5 rounded-md text-purple-700 bg-white shadow-sm border border-gray-200 transition">Revenue</button>
                <button class="px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-900 transition">Expense</button>
                <button class="px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-900 transition">Profit</button>
              </div>
            </div>
            <div class="relative h-56 md:h-64 w-full">
              <canvas id="branchLineChart" class="w-full h-full"></canvas>
            </div>
          </div>
          
          `;

html = html.substring(0, startIdx) + newHTML + html.substring(endIdx);
fs.writeFileSync('public/owner/index.html', html);
console.log("Updated HTML!");
