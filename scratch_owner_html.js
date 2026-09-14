const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const cmsTabHTML = `
        <!-- TAB: PENGURUSAN DATA (CMS) -->
        <div id="tab-cms" class="tab-content hidden w-full max-w-full">
          <div class="card flex flex-col border border-gray-200 p-0 overflow-hidden w-full max-w-full mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-gray-100 bg-gray-50 gap-4">
              <h4 class="font-bold text-lg text-gray-800" id="current-section-title">Urus Data</h4>
              <div class="flex flex-wrap gap-2">
                 <!-- CMS Nav Buttons -->
                 <select onchange="switchAdminTab(this.value)" class="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-700">
                    <option value="Haircuts">Gunting (Booking)</option>
                    <option value="Treatments">Rawatan (Booking)</option>
                    <option value="WalkInServices">Walk-In Gunting</option>
                    <option value="WalkInTreatments">Walk-In Rawatan</option>
                    <option value="OnCall">On-Call Servis</option>
                    <option value="Products">Produk E-Commerce</option>
                    <option value="Posters">Promosi (Poster)</option>
                    <option value="Branches">Cawangan</option>
                    <option value="Staff">Staf & Pekerja</option>
                    <option value="Settings">Tetapan Sistem & Yuran</option>
                    <option value="ResetRequests">Reset Password</option>
                 </select>
                 <button class="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow" id="main-save-btn" onclick="saveAllData()">
                    <i class="fas fa-cloud-upload-alt mr-1"></i> Simpan
                 </button>
              </div>
            </div>
            <div class="overflow-auto table-container min-h-[60vh] flex flex-col bg-white">
              <div id="dynamic-content" class="p-4 w-full h-full flex-1 admin-cms-wrapper">
                 <p class="text-gray-500 text-center mt-10">Sila tunggu...</p>
              </div>
            </div>
          </div>
        </div>
`;

// Insert the CMS Tab HTML right before "<!-- TAB: PENASIHAT AI (MOBILE CONTAINER) -->"
html = html.replace(/<!-- TAB: PENASIHAT AI \(MOBILE CONTAINER\) -->/, cmsTabHTML + "\n        <!-- TAB: PENASIHAT AI (MOBILE CONTAINER) -->");

// Include admin.css and admin.js
html = html.replace(/<\/head>/, '    <link rel="stylesheet" href="../css/admin.css?v=2">\n  </head>');
html = html.replace(/<script src="\.\.\/js\/owner\.js\?v=35"><\/script>/, '<script src="../js/owner.js?v=36"></script>\n    <script src="../js/admin.js?v=3"></script>');

fs.writeFileSync('public/owner/index.html', html);
