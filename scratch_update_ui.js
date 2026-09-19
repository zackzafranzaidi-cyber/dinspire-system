const fs = require('fs');
let html = fs.readFileSync('public/dev-sys-9x8q2/index.html', 'utf8');

const dataTabHtml = `
      <!-- TAB: DATA -->
      <div id="tab-data" class="tab-content hidden space-y-6">
        <div>
          <h3 class="text-2xl font-bold text-white mb-2">Pengurusan Data</h3>
          <p class="text-gray-400 text-sm">Muat turun, pemulihan (restore) pangkalan data, dan pemotongan arkib.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Backup -->
          <div class="bg-panel border border-gray-800 rounded-xl p-6 text-center space-y-4">
            <i class="fa-solid fa-cloud-arrow-down text-4xl text-primary"></i>
            <h4 class="text-white font-bold">Strim Backup JSON</h4>
            <p class="text-xs text-gray-400">Muat turun keseluruhan pangkalan data secara strim langsung (kalis Timeout 504).</p>
            <button onclick="downloadBackup()" class="w-full bg-blue-600/20 text-primary border border-primary hover:bg-primary hover:text-white font-medium py-2 rounded-lg transition-colors">Muat Turun Backup</button>
          </div>

          <!-- Restore -->
          <div class="bg-panel border border-gray-800 rounded-xl p-6 text-center space-y-4">
            <i class="fa-solid fa-cloud-arrow-up text-4xl text-yellow-500"></i>
            <h4 class="text-white font-bold">Pemulihan Data Pintar (Restore)</h4>
            <p class="text-xs text-gray-400">Pilih fail JSON backup untuk dipulihkan ke dalam pelayan.</p>
            <input type="file" id="restoreFile" class="hidden" accept=".json">
            <button onclick="document.getElementById('restoreFile').click()" class="w-full bg-yellow-600/20 text-yellow-500 border border-yellow-500 hover:bg-yellow-500 hover:text-white font-medium py-2 rounded-lg transition-colors">Pilih Fail & Pulihkan</button>
          </div>

          <!-- Prune -->
          <div class="bg-panel border border-gray-800 rounded-xl p-6 text-center space-y-4">
            <i class="fa-solid fa-scissors text-4xl text-purple-500"></i>
            <h4 class="text-white font-bold">Pemotongan Arkib (Prune)</h4>
            <p class="text-xs text-gray-400">Gunting data jualan melebihi 2 tahun dan simpannya ke jadual sejarah.</p>
            <button onclick="triggerPrune()" class="w-full bg-purple-600/20 text-purple-400 border border-purple-500 hover:bg-purple-600 hover:text-white font-medium py-2 rounded-lg transition-colors">Jalankan Pemotongan</button>
          </div>

          <!-- Factory Reset -->
          <div class="bg-panel border border-red-900 rounded-xl p-6 text-center space-y-4">
            <i class="fa-solid fa-skull-crossbones text-4xl text-danger"></i>
            <h4 class="text-danger font-bold">RESET KILANG 3-LAPIS</h4>
            <p class="text-xs text-gray-400">AMARAN: Akan menghapuskan kesemua rekod syarikat di dalam Supabase.</p>
            <button onclick="openResetModal()" class="w-full bg-danger text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors">KOSONGKAN DATA</button>
          </div>
        </div>
      </div>
`;

const healthTabHtml = `
      <!-- TAB: HEALTH -->
      <div id="tab-health" class="tab-content hidden space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-2xl font-bold text-white mb-2">Kesihatan Pelayan</h3>
            <p class="text-gray-400 text-sm">Pantau kelajuan pelayan, memori cache, dan ralat terkini.</p>
          </div>
          <button onclick="fetchHealth()" class="text-gray-400 hover:text-white"><i class="fa-solid fa-rotate-right"></i></button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-panel border border-gray-800 p-4 rounded-xl">
            <p class="text-xs text-gray-500">Latensi Pangkalan Data</p>
            <p class="text-xl font-bold text-white mt-1" id="metric-db">-- ms</p>
          </div>
          <div class="bg-panel border border-gray-800 p-4 rounded-xl">
            <p class="text-xs text-gray-500">Status Memori RAM</p>
            <p class="text-xl font-bold text-white mt-1" id="metric-ram">-- MB</p>
          </div>
          <div class="bg-panel border border-gray-800 p-4 rounded-xl">
            <p class="text-xs text-gray-500">Status Supabase</p>
            <p class="text-xl font-bold text-green-400 mt-1" id="metric-status">--</p>
          </div>
          <div class="bg-panel border border-gray-800 p-4 rounded-xl">
            <p class="text-xs text-gray-500">eSMS Gateway</p>
            <p class="text-xl font-bold text-white mt-1" id="metric-sms">--</p>
          </div>
        </div>

        <div class="bg-panel border border-gray-800 rounded-xl p-4">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-white font-bold"><i class="fa-solid fa-terminal text-gray-500 mr-2"></i>Live Error Logs (Akhir 50 baris)</h4>
            <span id="logFileName" class="text-xs text-gray-500">winston.log</span>
          </div>
          <div class="terminal-window" id="terminal-logs">Memuatkan log...</div>
        </div>

        <button onclick="flushCache()" class="w-full border border-gray-700 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
          <i class="fa-solid fa-broom"></i> Bersihkan Soft-Cache RAM
        </button>
      </div>
`;

const toolsTabHtml = `
      <!-- TAB: TOOLS -->
      <div id="tab-tools" class="tab-content hidden space-y-6">
        <div>
          <h3 class="text-2xl font-bold text-white mb-2">Simulasi & Alat</h3>
          <p class="text-gray-400 text-sm">Alat debugging untuk mempercepatkan penyelesaian pepijat pengguna.</p>
        </div>

        <!-- Impersonation -->
        <div class="bg-panel border border-gray-800 rounded-xl p-6">
          <h4 class="text-primary font-bold mb-4"><i class="fa-solid fa-masks-theater mr-2"></i>Mod Penyamaran (Login-As)</h4>
          <p class="text-sm text-gray-400 mb-4">Log masuk ke sesi pelanggan atau staf tanpa mengetahui kata laluan mereka.</p>
          <div class="flex flex-col md:flex-row gap-4">
            <select id="impersonateRole" class="bg-black border border-gray-700 text-white rounded-lg px-4 py-2 focus:border-primary focus:outline-none">
              <option value="customer">Pelanggan</option>
              <option value="staff">Staf</option>
              <option value="owner">Pemilik</option>
            </select>
            <input type="text" id="impersonateId" placeholder="ID Pengguna (UUID)" class="flex-1 bg-black border border-gray-700 text-white rounded-lg px-4 py-2 focus:border-primary focus:outline-none">
            <button onclick="triggerImpersonation()" class="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Jana Akses</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Sandbox Payment -->
          <div class="bg-panel border border-gray-800 rounded-xl p-6">
            <h4 class="text-white font-bold mb-2">Mod Sandbox Pembayaran</h4>
            <p class="text-xs text-gray-500 mb-4">Alihkan trafik pembayaran dari Live ke dev.toyyibpay.com. Tiada wang sebenar dipotong.</p>
            <label class="toggle-switch">
              <input type="checkbox" id="flag-sandbox" onchange="updateFlag('sandbox_payment', this.checked)">
              <div class="slider"></div>
            </label>
          </div>

          <!-- OTP Bypass -->
          <div class="bg-panel border border-gray-800 rounded-xl p-6">
            <h4 class="text-white font-bold mb-2">Pintasan Kecemasan OTP</h4>
            <p class="text-xs text-gray-500 mb-4">Berhenti menghantar SMS. Pendaftaran menggunakan OTP statik: 123456.</p>
            <label class="toggle-switch">
              <input type="checkbox" id="flag-otp" onchange="updateFlag('otp_bypass', this.checked)">
              <div class="slider"></div>
            </label>
          </div>

          <!-- Push Notifications -->
          <div class="bg-panel border border-gray-800 rounded-xl p-6 col-span-1 md:col-span-2">
            <h4 class="text-white font-bold mb-2">God Mode Push Notifications</h4>
            <p class="text-xs text-gray-500 mb-4">Langgan pelayar peranti ini untuk menerima makluman kerosakan pelayan dan laporan ralat dari Node.js.</p>
            <div class="flex gap-4">
              <button onclick="subscribeDevPush()" class="flex-1 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white py-2 rounded-lg text-sm">Aktifkan Langganan</button>
              <button onclick="testDevPush()" class="flex-1 bg-green-900/40 border border-green-700 text-green-400 hover:bg-green-800 py-2 rounded-lg text-sm">Uji Notifikasi</button>
            </div>
          </div>
        </div>
      </div>
`;

// Insert the code blocks into index.html replacing placeholders
html = html.replace('<!-- To be filled in next step -->', dataTabHtml.substring(dataTabHtml.indexOf('<div>')));
html = html.replace('<!-- TAB: HEALTH -->\n      <div id="tab-health" class="tab-content hidden space-y-6">\n        <div><h3 class="text-2xl font-bold text-white mb-2">Kesihatan Pelayan</h3></div>\n      </div>', healthTabHtml);
html = html.replace('<!-- TAB: TOOLS -->\n      <div id="tab-tools" class="tab-content hidden space-y-6">\n        <div><h3 class="text-2xl font-bold text-white mb-2">Simulasi & Alat</h3></div>\n      </div>', toolsTabHtml);

// Add Factory Reset Modal at the bottom of body
const resetModal = `
  <!-- Factory Reset Modal -->
  <div id="resetModal" class="hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-panel border border-red-900 rounded-2xl w-full max-w-md p-6">
      <h3 class="text-xl font-bold text-danger mb-2"><i class="fa-solid fa-triangle-exclamation mr-2"></i>AMARAN PEMADAMAN DATA</h3>
      <p class="text-gray-300 text-sm mb-4">Tindakan ini akan memadam SELURUH pangkalan data Dinspire. Tindakan ini tidak boleh diundur (Irreversible).</p>
      
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Sila taip: DELETE-ALL-DINSPIRE-DATA</label>
          <input type="text" id="resetPhrase" class="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-danger outline-none" autocomplete="off">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Kod Laluan / OTP Pembangun</label>
          <input type="password" id="resetOTP" class="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-danger outline-none">
        </div>
        
        <div class="flex gap-4 mt-6">
          <button onclick="closeResetModal()" class="flex-1 bg-gray-800 text-white py-2 rounded-lg">Batal</button>
          <button onclick="executeFactoryReset()" class="flex-1 bg-danger hover:bg-red-700 text-white font-bold py-2 rounded-lg">KOSONGKAN SEKARANG</button>
        </div>
      </div>
    </div>
  </div>
`;
html = html.replace('<script src="/dev-sys-9x8q2/js/app.js"></script>', resetModal + '\n  <script src="/dev-sys-9x8q2/js/app.js"></script>');

fs.writeFileSync('public/dev-sys-9x8q2/index.html', html);
console.log('UI updated successfully!');
