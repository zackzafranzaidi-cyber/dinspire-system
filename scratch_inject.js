const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

const newSettingBlock = `
          <!-- Kad Komisen Part Time -->
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <i class="fas fa-hand-holding-usd text-lg"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-sm uppercase tracking-wider">Komisen Part Time</h4>
                <p class="text-[11px] text-gray-400 font-medium">Berapa % jualan yang staf Part Time dapat (%)</p>
              </div>
            </div>
            <div class="relative">
              <input type="number" value="\${s.komisen_part_time !== undefined ? s.komisen_part_time : (s.peratus_komisen || 50)}" onchange="updateSetting('komisen_part_time', this.value)" class="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm text-right" placeholder="50" min="0" max="100">
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
            </div>
          </div>
`;

// Insert after the Kad Komisen Staf block
const searchTarget = `              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
            </div>
          </div>`;

content = content.replace(searchTarget, searchTarget + '\n' + newSettingBlock);

// Also update default
content = content.replace('peratus_komisen: 50,', 'peratus_komisen: 50,\n          komisen_part_time: 50,');

fs.writeFileSync('public/owner/js/owner_cms.js', content);
console.log("Injected komisen_part_time UI into settings tab.");
