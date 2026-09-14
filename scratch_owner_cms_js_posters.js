const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

const regex = /function renderPosters\(dataArr, container\) \{[\s\S]*?container\.innerHTML = html;\s*\}/;

const newRenderPosters = `function renderPosters(dataArr, container) {
  let html = \`
    <div class="mb-4 bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3">
      <i class="fas fa-image text-purple-500 text-lg"></i>
      <p class="text-sm text-purple-800 m-0">Poster akan dipaparkan sebagai "carousel slider" pada halaman utama aplikasi pelanggan. Nisbah lebar yang dicadangkan adalah <strong>16:9</strong> (mendatar). Tekan "Simpan ke Cloud" selepas memuat naik imej.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
  \`;

  dataArr.forEach((row, index) => {
    let currentImg = row.imageUrl || "https://via.placeholder.com/800x450?text=Upload+Poster";
    html += \`
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <!-- Image Container (16:9 aspect ratio) -->
        <div class="relative w-full aspect-video bg-gray-50 border-b border-gray-100 group-hover:border-purple-100 transition-colors">
          <img src="\${currentImg}" class="w-full h-full object-cover" alt="Poster">
          <label class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-300 backdrop-blur-[2px]">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 backdrop-blur-md">
              <i class="fas fa-camera text-xl"></i>
            </div>
            <span class="text-sm font-bold tracking-wide">Tukar Poster</span>
            <input type="file" class="hidden" accept="image/*" onchange="handleAdminImageUpload(this, 'Posters', \${index}, 'imageUrl')">
          </label>
        </div>
        
        <!-- Delete Button Container -->
        <div class="p-4 bg-white flex justify-between items-center">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Poster #\${index + 1}</span>
          <button onclick="deleteRow('Posters', \${index})" class="px-4 py-2 bg-white border-2 border-gray-100 text-gray-400 font-bold text-xs rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center gap-2">
            <i class="fas fa-trash"></i> Padam
          </button>
        </div>
      </div>
    \`;
  });

  // Add New Poster Card
  html += \`
      <div onclick="addRow('Posters')" class="bg-purple-50/30 rounded-3xl border-2 border-dashed border-purple-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 aspect-video group">
        <div class="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
          <i class="fas fa-plus text-xl"></i>
        </div>
        <h4 class="font-bold text-purple-600 text-base">Tambah Poster</h4>
      </div>
    </div>
  \`;

  container.innerHTML = html;
}`;

code = code.replace(regex, newRenderPosters);
fs.writeFileSync('public/js/owner_cms.js', code);
