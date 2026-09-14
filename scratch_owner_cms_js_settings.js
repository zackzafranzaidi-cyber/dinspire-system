const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

const regex = /if \(tabName === "Settings"\) \{[\s\S]*?return;\s*\}/;

const newSettings = `if (tabName === "Settings") {
      let s = appData.Settings || {};
      container.innerHTML = \`
        <div class="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
          <i class="fas fa-cog text-blue-500 text-lg"></i>
          <p class="text-sm text-blue-800 m-0">Konfigurasi nilai mata wang dan peratusan sistem. Tekan <strong>"Simpan ke Cloud"</strong> di bahagian atas setelah selesai.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Kad Caj Penghantaran -->
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <i class="fas fa-truck text-lg"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-sm uppercase tracking-wider">Caj Penghantaran</h4>
                <p class="text-[11px] text-gray-400 font-medium">Beli produk melalui pos (RM)</p>
              </div>
            </div>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">RM</span>
              <input type="number" value="\${s.shipping_fee || 0}" onchange="updateSetting('shipping_fee', this.value)" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm" placeholder="0.00" min="0">
            </div>
          </div>

          <!-- Kad Yuran Tempahan -->
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <i class="fas fa-receipt text-lg"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-sm uppercase tracking-wider">Yuran Tempahan</h4>
                <p class="text-[11px] text-gray-400 font-medium">Caj tempahan perkhidmatan dalam talian (RM)</p>
              </div>
            </div>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">RM</span>
              <input type="number" value="\${s.service_fee || 0}" onchange="updateSetting('service_fee', this.value)" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm" placeholder="0.00" min="0">
            </div>
          </div>

          <!-- Kad Komisen Staf -->
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <i class="fas fa-percentage text-lg"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-sm uppercase tracking-wider">Peratus Komisen</h4>
                <p class="text-[11px] text-gray-400 font-medium">Berapa % jualan yang staf dapat (%)</p>
              </div>
            </div>
            <div class="relative">
              <input type="number" value="\${s.peratus_komisen || 50}" onchange="updateSetting('peratus_komisen', this.value)" class="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm text-right" placeholder="50" min="0" max="100">
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
            </div>
          </div>

          <!-- Kad Gaji Asas -->
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <i class="fas fa-money-bill-wave text-lg"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-sm uppercase tracking-wider">Gaji Asas (Threshold)</h4>
                <p class="text-[11px] text-gray-400 font-medium">Bonus komisen melebihi nilai ini (RM)</p>
              </div>
            </div>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">RM</span>
              <input type="number" value="\${s.gaji_asas || 1800}" onchange="updateSetting('gaji_asas', this.value)" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm" placeholder="1800.00" min="0">
            </div>
          </div>
        </div>
      \`;
      return;
    }`;

code = code.replace(regex, newSettings);
fs.writeFileSync('public/js/owner_cms.js', code);
