const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

const regex = /function renderProducts\(dataArr, container\) \{[\s\S]*?container\.innerHTML = html;\s*\}/;

const newRenderProducts = `function renderProducts(dataArr, container) {
  let html = \`
    <div class="mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
      <i class="fas fa-info-circle text-indigo-500 text-lg"></i>
      <p class="text-sm text-indigo-800 m-0">Ukuran imej disyorkan: <strong>500 x 500 px</strong> (nisbah 1:1). Tekan "Simpan ke Cloud" selepas memuat naik imej.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
  \`;

  dataArr.forEach((row, index) => {
    let currentImg = row.imageUrl || "https://via.placeholder.com/500x500?text=Upload+Produk";
    html += \`
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <!-- Image Container -->
        <div class="relative w-full aspect-square bg-gray-50 border-b border-gray-100 group-hover:border-indigo-100 transition-colors">
          <img src="\${currentImg}" class="w-full h-full object-cover" alt="Produk">
          <label class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-300 backdrop-blur-[2px]">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 backdrop-blur-md">
              <i class="fas fa-camera text-xl"></i>
            </div>
            <span class="text-sm font-bold tracking-wide">Tukar Imej</span>
            <input type="file" class="hidden" accept="image/*" onchange="handleAdminImageUpload(this, 'Products', \${index}, 'imageUrl')">
          </label>
        </div>
        
        <!-- Form Container -->
        <div class="p-5 flex flex-col gap-4 flex-1">
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Nama Produk</label>
            <input type="text" value="\${escapeHTML(row.name || "")}" onchange="updateData('Products', \${index}, 'name', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-gray-800 shadow-sm placeholder-gray-400" placeholder="Cth: Pomade Asli">
          </div>
          
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Harga (RM)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">RM</span>
                <input type="number" value="\${escapeHTML(row.price || "")}" onchange="updateData('Products', \${index}, 'price', this.value)" class="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-indigo-600 shadow-sm placeholder-gray-400" placeholder="0.00">
              </div>
            </div>
            <div class="w-24">
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Stok</label>
              <input type="number" value="\${escapeHTML(row.stok || "")}" onchange="updateData('Products', \${index}, 'stok', this.value)" class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-gray-800 shadow-sm placeholder-gray-400 text-center" placeholder="0">
            </div>
          </div>
        </div>
        
        <!-- Delete Button Container -->
        <div class="px-5 pb-5 mt-auto">
          <button onclick="deleteRow('Products', \${index})" class="w-full py-2.5 bg-white border-2 border-gray-100 text-gray-400 font-bold text-xs rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2">
            <i class="fas fa-trash"></i> Padam Produk
          </button>
        </div>
      </div>
    \`;
  });

  // Add New Product Card
  html += \`
      <div onclick="addRow('Products')" class="bg-indigo-50/30 rounded-3xl border-2 border-dashed border-indigo-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 min-h-[350px] group">
        <div class="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
          <i class="fas fa-plus text-2xl"></i>
        </div>
        <h4 class="font-bold text-indigo-600 text-lg">Tambah Produk</h4>
        <p class="text-xs text-indigo-400 mt-1">Klik di sini untuk daftar produk baru</p>
      </div>
    </div>
  \`;

  container.innerHTML = html;
}`;

code = code.replace(regex, newRenderProducts);
fs.writeFileSync('public/js/owner_cms.js', code);
