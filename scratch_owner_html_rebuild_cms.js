const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const regex = /<div id="tab-cms" class="tab-content hidden w-full max-w-full">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newCMS = `<div id="tab-cms" class="tab-content hidden w-full max-w-full">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h4 class="font-bold text-2xl text-gray-800 tracking-tight" id="current-section-title">Urus Data</h4>
              <div class="flex gap-2">
                 <!-- CMS Nav Buttons Mobile -->
                 <select id="cms-dropdown" onchange="switchAdminTab(this.value)" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-700 md:hidden shadow-sm">
                    <option value="Haircuts">Gunting (Booking)</option>
                    <option value="Treatments">Rawatan (Booking)</option>
                    <option value="WalkInServices">Walk-In Gunting</option>
                    <option value="WalkInTreatments">Walk-In Rawatan</option>
                    <option value="OnCall">On-Call Servis</option>
                    <option value="Products">Produk E-Commerce</option>
                    <option value="Posters">Promosi (Poster)</option>
                    <option value="Branches">Cawangan</option>
                    <option value="Staff">Staf & Pekerja</option>
                    <option value="Settings">Tetapan Sistem</option>
                    <option value="ResetRequests">Reset Password</option>
                 </select>
                 <button class="bg-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow flex items-center gap-2" id="main-save-btn" onclick="saveAllData()">
                    <i class="fas fa-cloud-upload-alt"></i> Simpan ke Cloud
                 </button>
              </div>
            </div>
            
            <div id="dynamic-content" class="w-full">
              <!-- Content rendered here -->
            </div>
          </div>`;

html = html.replace(regex, newCMS);
fs.writeFileSync('public/owner/index.html', html);
