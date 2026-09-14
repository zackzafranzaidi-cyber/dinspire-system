

let appData = {};



const SCHEMAS = {
  Haircuts: ["id", "name", "desc", "price"],
  Treatments: ["id", "name", "desc", "price"],
  Branches: ["id", "name", "location", "imageUrl", "lat", "lng"],
  Staff: ["id", "name", "jenis_staf", "branch_id", "kemahiran"],
  OnCall: ["id", "name", "price"],
  WalkInServices: ["id", "name", "price"],
  WalkInTreatments: ["id", "name", "price"],
  Products: ["id", "name", "price", "imageUrl", "stok"],
  Posters: ["id", "imageUrl"],
};

let currentTab = "Haircuts";


// Expose initAdminCMS globally
window.initAdminCMS = function() {
    if (Object.keys(appData).length === 0) {
        loadAdminData();
    }
};
async function loadAdminData() {
  showGlobalLoader();
  try {
    const res = await fetch(`${API_BASE_URL}/admin/data`, {
      credentials: "include",
    });
    if (res.status === 401 || res.status === 403) {
      if(typeof logoutOwner === "function") logoutOwner();;
      return;
    }

    const result = await res.json();
    if (result.status === "success") {
      appData = result.data;
      if (!appData.Settings)
        appData.Settings = {
          shipping_fee: 0,
          service_fee: 0,
          peratus_komisen: 50,
          gaji_asas: 1800,
        };
      renderTable(currentTab);
    }
  } catch (err) {
    console.error("Gagal memuatkan data admin:", err);
  } finally {
    hideGlobalLoader();
  }
}




function switchAdminTab(tabName, el) {
  showGlobalLoader();

  currentTab = tabName;
  
  // Update sidebar active states manually
  document.querySelectorAll("[id^='nav-cms-']").forEach(nav => {
      nav.classList.remove("text-white", "bg-white/10");
      nav.classList.add("text-gray-400");
  });
  const activeNav = document.getElementById("nav-cms-" + tabName);
  if (activeNav) {
      activeNav.classList.remove("text-gray-400");
      activeNav.classList.add("text-white", "bg-white/10");
  }

  // Also sync the select dropdown just in case
  const dropdown = document.getElementById("cms-dropdown");
  if(dropdown) dropdown.value = tabName;

  let titles = {

    Haircuts: "Haircuts (Booking)",
    Treatments: "Treatments (Booking)",
    Branches: "Branches",
    Staff: "Kesemua Staf & Pekerja",
    OnCall: "On-Call Services",
    WalkInServices: "Walk-In Haircuts",
    WalkInTreatments: "Walk-In Treatments",
    Products: "Products",
    Posters: "Promotions (Posters)",
    Settings: "System Settings & Fees",
    ResetRequests: "Password Reset Requests",
  };
  document.getElementById("current-section-title").innerText =
    "Manage " + (titles[tabName] || tabName);

  renderTable(tabName); if (tabName !== "ResetRequests") {
    setTimeout(hideGlobalLoader, 300);
  }
}

function updateSetting(key, val) {
  if (!appData.Settings) appData.Settings = {};
  appData.Settings[key] = parseFloat(val) || 0;
}

function renderTable(tabName) {
  const container = document.getElementById("dynamic-content");

  if (tabName === "ResetRequests") {
    loadResetRequests();
    return;
  }

  if (tabName === "Settings") {
      let s = appData.Settings || {};
      container.innerHTML = `
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
              <input type="number" value="${s.shipping_fee || 0}" onchange="updateSetting('shipping_fee', this.value)" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm" placeholder="0.00" min="0">
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
              <input type="number" value="${s.service_fee || 0}" onchange="updateSetting('service_fee', this.value)" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm" placeholder="0.00" min="0">
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
              <input type="number" value="${s.peratus_komisen || 50}" onchange="updateSetting('peratus_komisen', this.value)" class="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm text-right" placeholder="50" min="0" max="100">
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
              <input type="number" value="${s.gaji_asas || 1800}" onchange="updateSetting('gaji_asas', this.value)" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-lg font-bold text-gray-700 shadow-sm" placeholder="1800.00" min="0">
            </div>
          </div>
        </div>
      `;
      return;
    }

  if (tabName === "Posters") {
    renderPosters(appData[tabName] || [], container);
    return;
  }

  if (tabName === "Products") {
    renderProducts(appData[tabName] || [], container);
    return;
  }

  let dataArr = appData[tabName] || [];
  let cols = SCHEMAS[tabName];

  let html = `<div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-4">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr class="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
`;
  
  cols.forEach((c) => {
    if (tabName === "Branches" && (c === "lat" || c === "lng")) return;
    if (c === "id") {
      html += `<th style="display:none;">${c}</th>`;
    } else {
      html += `<th class="px-6 py-4">${c}</th>`;
    }
  });
  html += `<th class="px-6 py-4 text-center" style="width: 80px;">TINDAKAN</th></tr></thead><tbody class="divide-y divide-gray-100">`;

  dataArr.forEach((row, index) => {
    html += `<tr class="hover:bg-indigo-50/40 transition-colors">`;
    cols.forEach((c) => {
      if (tabName === "Branches" && (c === "lat" || c === "lng")) return;
      
      if (c === "id") {
        html += `<td style="display:none;"><input type="hidden" value="${escapeHTML(row[c] || "")}"></td>`;
      } else if (c === "imageUrl") {
        let currentImg = row[c] || "https://via.placeholder.com/60?text=IMG";
        html += `<td class="px-6 py-3"><div class="flex items-center gap-4"><img src="${currentImg}" class="w-12 h-12 object-cover rounded-xl border border-gray-200 shadow-sm"><input type="file" accept="image/*" onchange="handleAdminImageUpload(this, '${tabName}', ${index}, '${c}')" class="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer w-48"></div></td>`;
      } else if (c === "jenis_staf" && tabName === "Staff") {
        let opts = ["In-Branch", "On-Call", "General"].map(j => `<option value="${j}" ${row[c] === j ? "selected" : ""}>${j}</option>`).join("");
        html += `<td class="px-6 py-3"><select onchange="updateData('${tabName}', ${index}, '${c}', this.value); setTimeout(()=>renderTable('${tabName}'), 100);" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm">${opts}</select></td>`;
      } else if (c === "branch_id" && tabName === "Staff") {
        if (row.jenis_staf === "On-Call" || row.jenis_staf === "General") {
           html += `<td class="px-6 py-3"><span class="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg border border-gray-200">Tidak Berkenaan</span></td>`;
        } else {
           let opts = `<option value="" disabled selected>-- Pilih Cawangan --</option>`;
           (appData["Branches"] || []).forEach((b) => {
             let sel = row[c] === b.id ? "selected" : "";
             opts += `<option value="${b.id}" ${sel}>${escapeHTML(b.name)}</option>`;
           });
           html += `<td class="px-6 py-3"><select onchange="updateData('${tabName}', ${index}, '${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm">${opts}</select></td>`;
        }
      } else if (c === "kemahiran" && tabName === "Staff") {
        if (row.jenis_staf === "General") {
           html += `<td class="px-6 py-3"><span class="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg border border-gray-200">Tidak Berkenaan</span></td>`;
        } else {
          let chkH = row.can_haircut !== false ? "checked" : "";
          let chkT = row.can_treatment !== false ? "checked" : "";
          html += `<td class="px-6 py-3">
            <div class="flex flex-col gap-2">
              <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                <input type="checkbox" ${chkH} onchange="updateCapabilities(${index}, 'can_haircut', this.checked)" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="text-sm font-bold text-gray-700">Guntingan</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                <input type="checkbox" ${chkT} onchange="updateCapabilities(${index}, 'can_treatment', this.checked)" class="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500">
                <span class="text-sm font-bold text-gray-700">Rawatan</span>
              </label>
            </div>
          </td>`;
        }
      } else if (tabName === "Branches" && c === "location") {
        html += `<td class="px-6 py-3">
          <div class="flex gap-2 min-w-[250px]">
            <input type="text" value="${escapeHTML(row[c] || "")}" onchange="updateData('${tabName}', ${index}, '${c}', this.value)" class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm placeholder-gray-400">
            <button onclick="openMapPicker(${index})" class="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center shrink-0" title="Tetapkan Lokasi GPS">
              <i class="fas fa-map-marker-alt"></i>
            </button>
          </div>
        </td>`;
      } else if (c === "desc") {
        html += `<td class="px-6 py-3 w-1/3"><input type="text" value="${escapeHTML(row[c] || "")}" onchange="updateData('${tabName}', ${index}, '${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm placeholder-gray-400"></td>`;
      } else {
        html += `<td class="px-6 py-3 min-w-[150px]"><input type="${c==='price'||c==='stok'?'number':'text'}" value="${escapeHTML(row[c] || "")}" onchange="updateData('${tabName}', ${index}, '${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold shadow-sm placeholder-gray-400 ${c==='price'?'text-indigo-600':'text-gray-700'}"></td>`;
      }
    });

    html += `<td class="px-6 py-3 text-center">
      <button onclick="deleteRow('${tabName}', ${index})" class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm mx-auto" title="Padam Rekod">
        <i class="fas fa-trash text-sm"></i>
      </button>
    </td></tr>`;
  });

  html += `</tbody></table></div></div>`;
  
  html += `
    <button onclick="addRow('${tabName}')" class="group flex items-center justify-center w-full py-5 mt-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 rounded-3xl text-indigo-600 font-bold transition-all cursor-pointer shadow-sm">
      <div class="flex items-center gap-3 group-hover:scale-105 transition-transform">
        <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
          <i class="fas fa-plus text-sm"></i>
        </div>
        Tambah Rekod Baru
      </div>
    </button>
  `;

  container.innerHTML = html;
}

function renderPosters(dataArr, container) {
  let html = `
    <div class="mb-4 bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3">
      <i class="fas fa-image text-purple-500 text-lg"></i>
      <p class="text-sm text-purple-800 m-0">Poster akan dipaparkan sebagai "carousel slider" pada halaman utama aplikasi pelanggan. Nisbah lebar yang dicadangkan adalah <strong>16:9</strong> (mendatar). Tekan "Simpan ke Cloud" selepas memuat naik imej.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
  `;

  dataArr.forEach((row, index) => {
    let currentImg = row.imageUrl || "https://via.placeholder.com/800x450?text=Upload+Poster";
    html += `
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <!-- Image Container (16:9 aspect ratio) -->
        <div class="relative w-full aspect-video bg-gray-50 border-b border-gray-100 group-hover:border-purple-100 transition-colors">
          <img src="${currentImg}" class="w-full h-full object-cover" alt="Poster">
          <label class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-300 backdrop-blur-[2px]">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 backdrop-blur-md">
              <i class="fas fa-camera text-xl"></i>
            </div>
            <span class="text-sm font-bold tracking-wide">Tukar Poster</span>
            <input type="file" class="hidden" accept="image/*" onchange="handleAdminImageUpload(this, 'Posters', ${index}, 'imageUrl')">
          </label>
        </div>
        
        <!-- Delete Button Container -->
        <div class="p-4 bg-white flex justify-between items-center">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Poster #${index + 1}</span>
          <button onclick="deleteRow('Posters', ${index})" class="px-4 py-2 bg-white border-2 border-gray-100 text-gray-400 font-bold text-xs rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center gap-2">
            <i class="fas fa-trash"></i> Padam
          </button>
        </div>
      </div>
    `;
  });

  // Add New Poster Card
  html += `
      <div onclick="addRow('Posters')" class="bg-purple-50/30 rounded-3xl border-2 border-dashed border-purple-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 aspect-video group">
        <div class="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
          <i class="fas fa-plus text-xl"></i>
        </div>
        <h4 class="font-bold text-purple-600 text-base">Tambah Poster</h4>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function renderProducts(dataArr, container) {
  let html = `
    <div class="mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
      <i class="fas fa-info-circle text-indigo-500 text-lg"></i>
      <p class="text-sm text-indigo-800 m-0">Ukuran imej disyorkan: <strong>500 x 500 px</strong> (nisbah 1:1). Tekan "Simpan ke Cloud" selepas memuat naik imej.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
  `;

  dataArr.forEach((row, index) => {
    let currentImg = row.imageUrl || "https://via.placeholder.com/500x500?text=Upload+Produk";
    html += `
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <!-- Image Container -->
        <div class="relative w-full aspect-square bg-gray-50 border-b border-gray-100 group-hover:border-indigo-100 transition-colors">
          <img src="${currentImg}" class="w-full h-full object-cover" alt="Produk">
          <label class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-300 backdrop-blur-[2px]">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 backdrop-blur-md">
              <i class="fas fa-camera text-xl"></i>
            </div>
            <span class="text-sm font-bold tracking-wide">Tukar Imej</span>
            <input type="file" class="hidden" accept="image/*" onchange="handleAdminImageUpload(this, 'Products', ${index}, 'imageUrl')">
          </label>
        </div>
        
        <!-- Form Container -->
        <div class="p-5 flex flex-col gap-4 flex-1">
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Nama Produk</label>
            <input type="text" value="${escapeHTML(row.name || "")}" onchange="updateData('Products', ${index}, 'name', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-gray-800 shadow-sm placeholder-gray-400" placeholder="Cth: Pomade Asli">
          </div>
          
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Harga (RM)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">RM</span>
                <input type="number" value="${escapeHTML(row.price || "")}" onchange="updateData('Products', ${index}, 'price', this.value)" class="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-indigo-600 shadow-sm placeholder-gray-400" placeholder="0.00">
              </div>
            </div>
            <div class="w-24">
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Stok</label>
              <input type="number" value="${escapeHTML(row.stok || "")}" onchange="updateData('Products', ${index}, 'stok', this.value)" class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-gray-800 shadow-sm placeholder-gray-400 text-center" placeholder="0">
            </div>
          </div>
        </div>
        
        <!-- Delete Button Container -->
        <div class="px-5 pb-5 mt-auto">
          <button onclick="deleteRow('Products', ${index})" class="w-full py-2.5 bg-white border-2 border-gray-100 text-gray-400 font-bold text-xs rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2">
            <i class="fas fa-trash"></i> Padam Produk
          </button>
        </div>
      </div>
    `;
  });

  // Add New Product Card
  html += `
      <div onclick="addRow('Products')" class="bg-indigo-50/30 rounded-3xl border-2 border-dashed border-indigo-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 min-h-[350px] group">
        <div class="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
          <i class="fas fa-plus text-2xl"></i>
        </div>
        <h4 class="font-bold text-indigo-600 text-lg">Tambah Produk</h4>
        <p class="text-xs text-indigo-400 mt-1">Klik di sini untuk daftar produk baru</p>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// [DIBAIKI] Fungsi Memampat Imej Diubah ke Sistem Promise yang Stabil
function processImageCompression(file, maxWidth = 600) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        let scaleSize = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.70));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleAdminImageUpload(inputEl, tabName, index, col) {
  const file = inputEl.files[0];
  if (!file) return;
  const btnSave = document.getElementById("main-save-btn");
  btnSave.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Memampatkan...";
  btnSave.disabled = true;

  try {
    // Tunggu sehingga proses pemampatan siap 100%
    const compressedBase64 = await processImageCompression(file);

    // Kemas kini data terus ke dalam memori aplikasi
    updateData(tabName, index, col, compressedBase64);
    
    // Cari elemen <img> yang sesuai untuk dikemas kini
    const cardContainer = inputEl.closest('.poster-card, .product-card');
    if (cardContainer) {
      const imgEl = cardContainer.querySelector('img');
      if (imgEl) imgEl.src = compressedBase64;
    } else if (inputEl.previousElementSibling && inputEl.previousElementSibling.tagName === "IMG") {
      inputEl.previousElementSibling.src = compressedBase64;
    }
  } catch (error) {
    console.error("Gagal memampat imej:", error);
    Swal.fire({
      icon: "error",
      title: "Ralat Pemampatan",
      text: "Imej anda gagal diproses. Sila cuba saiz yang lebih kecil.",
    });
  } finally {
    // Buka butang simpan semula selepas pemampatan selesai
    btnSave.innerHTML =
      "<i class='fas fa-cloud-upload-alt'></i> Simpan ke Cloud";
    btnSave.disabled = false;
  }
}

function addRow(tabName) {
  if (!appData[tabName]) appData[tabName] = [];

  if (tabName === "Posters" && appData[tabName].length >= 3) {
    Swal.fire({
      icon: "warning",
      title: "Had Maksimum",
      text: "Maksimum 3 poster sahaja dibenarkan.",
    });
    return;
  }

  let newObj = {};
  SCHEMAS[tabName].forEach((col) => (newObj[col] = ""));
  
  if (tabName === "Staff") {
    newObj.jenis_staf = "In-Branch";
    newObj.can_haircut = true;
    newObj.can_treatment = false;
  }
  
  if (tabName === "Branches") {
    let maxNum = 0;
    (appData[tabName] || []).forEach(b => {
      if (b.id && b.id.startsWith("BBR")) {
        let num = parseInt(b.id.substring(3), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    newObj.id = "BBR" + String(maxNum + 1).padStart(4, "0");
  } else {
    newObj.id = crypto.randomUUID ? crypto.randomUUID() : "id_" + Date.now();
  }
  
  appData[tabName].push(newObj);
  renderTable(tabName);
}

function deleteRow(tabName, index) {
  Swal.fire({
    title: "Adakah anda pasti?",
    text: "Rekod ini akan dipadamkan dari jadual!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#FF3B30",
    cancelButtonColor: "#8E8E93",
    confirmButtonText: "Ya, Padam!",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      appData[tabName].splice(index, 1);
      renderTable(tabName);
    }
  });
}

function updateData(tabName, index, col, value) {
  appData[tabName][index][col] = value;
}

async function saveAllData() {
  showGlobalLoader();
  const btn = document.getElementById("main-save-btn");
  btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Menyimpan...";
  btn.disabled = true;

  let cleanData = {};
  Object.keys(SCHEMAS).forEach((tab) => {
    cleanData[tab] = (appData[tab] || []).map((item) => {
      let cleanItem = {};
      SCHEMAS[tab].forEach((col) => {
        if (tab === "Staff" && col === "kemahiran") {
          cleanItem.can_haircut = item.can_haircut;
          cleanItem.can_treatment = item.can_treatment;
        } else {
          cleanItem[col] = item[col] || null;
        }
      });
      return cleanItem;
    });
  });

  cleanData.Settings = appData.Settings || {};

  try {
    const res = await fetch(`${API_BASE_URL}/admin/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ data: cleanData }),
    });

    if (res.status === 401 || res.status === 403) {
      Swal.fire({
        icon: "warning",
        title: "Sesi Tamat",
        text: "Sistem akan log keluar secara automatik.",
      }).then(() => {
        if(typeof logoutOwner === "function") logoutOwner();;
      });
      return;
    }

    const result = await res.json();
    if (result.status === "success") {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Semua data telah dikemas kini di Cloud Supabase.",
        confirmButtonText: "Selesai",
      });
      alert("Data telah disimpan dan diselaraskan ke semua cawangan!");
      loadAdminData();
    } else {
      Swal.fire({
        icon: "error",
        title: "Ralat Pangkalan Data",
        text: result.message,
      });
    }
  } catch (err) {
    console.error("Gagal sync:", err);
    alert("Ralat semasa menyimpan ke database.");
  } finally {
    btn.innerHTML = `<i class="fas fa-save"></i> Simpan Data Master`;
    btn.disabled = false;
    hideGlobalLoader();
  }
}

async function loadResetRequests() {
  const container = document.getElementById("dynamic-content");
  container.innerHTML = ``;
  showGlobalLoader();
  try {
    const res = await fetch(`${API_BASE_URL}/admin/staff/reset-requests`, { credentials: "include" });
    const result = await res.json();

    if (result.data && result.data.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px; background:#F9FAFB; border-radius:16px; border:2px dashed #E5E5EA;">
          <div style="margin-bottom:15px;"><i class="fas fa-check-circle" style="font-size:48px; color:#22c55e;"></i></div>
          <h3 style="font-size:18px; font-weight:700; color:#1c1c1e;">Tiada Permohonan Reset</h3>
          <p style="font-size:13px; color:#8e8e93; margin-top:8px;">Semua kata laluan staf dalam keadaan baik. Tiada permintaan reset yang menunggu kelulusan.</p>
        </div>`;
      return;
    }

    let html = `
      <div style="margin-bottom:20px; padding:15px; background:#FFF8E1; border-radius:12px; border-left:4px solid #FFC107; display:flex; align-items:center; gap:12px;">
        <i class="fas fa-exclamation-triangle" style="color:#F57F17; font-size:20px;"></i>
        <div>
          <strong style="color:#1c1c1e; font-size:14px;">Permohonan Reset Menunggu Kelulusan</strong>
          <p style="font-size:12px; color:#8e8e93; margin:4px 0 0;">Staf berikut telah memohon reset kata laluan. Klik "Luluskan" untuk set semula kata laluan mereka kepada <strong>123123</strong>.</p>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">`;

    result.data.forEach(staff => {
      html += `
        <div style="background:white; border-radius:14px; padding:20px 25px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 10px rgba(0,0,0,0.06); border:1px solid #F0F0F5;">
          <div style="display:flex; align-items:center; gap:15px;">
            <div style="width:48px; height:48px; border-radius:50%; background:#FFF3E0; color:#E65100; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800;">
              ${escapeHTML(staff.username.charAt(0).toUpperCase())}
            </div>
            <div>
              <div style="font-size:16px; font-weight:700; color:#1c1c1e;">${escapeHTML(staff.username)}</div>
              <div style="font-size:12px; color:#8e8e93; margin-top:3px;">
                <i class="fas fa-briefcase" style="margin-right:4px;"></i>${escapeHTML(staff.jenis_staf || 'Staff')}
              </div>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="background:#FFF3E0; color:#E65100; font-size:11px; font-weight:700; padding:5px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">
              <i class="fas fa-clock" style="margin-right:4px;"></i>Menunggu Kelulusan
            </span>
            <button onclick="approveReset('${staff.id}', '${escapeHTML(staff.username)}')" 
              style="background:#2196F3; color:white; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:7px; transition:0.2s;"
              onmouseover="this.style.background='#1976D2'" onmouseout="this.style.background='#2196F3'">
              <i class="fas fa-check-circle"></i> Luluskan
            </button>
          </div>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#FF3B30;"><i class="fas fa-exclamation-circle" style="font-size:24px;"></i><p style="margin-top:10px;">Gagal memuatkan senarai. Sila refresh halaman.</p></div>`;
  } finally {
    hideGlobalLoader();
  }
}

async function approveReset(staffId, staffName) {
  const confirm = await Swal.fire({
    title: `Luluskan Reset untuk ${staffName}?`,
    html: `Kata laluan <strong>${staffName}</strong> akan ditetapkan semula kepada <code style="background:#F0F0F0; padding:2px 6px; border-radius:4px;">123123</code>.<br><br>Staf tersebut perlu log masuk dan menukar kata laluan baru selepas ini.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#2196F3",
    cancelButtonColor: "#8E8E93",
    confirmButtonText: "<i class='fas fa-check'></i> Ya, Luluskan!",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/staff/${staffId}/approve-reset`, {
      method: "PUT",
      credentials: "include",
    });
    const result = await res.json();
    if (result.status === "success") {
      Swal.fire({
        icon: "success",
        title: "Berjaya!",
        html: `Reset kata laluan untuk <strong>${staffName}</strong> telah diluluskan.<br>Kata laluan sementara: <code style="background:#F0F0F0; padding:2px 6px; border-radius:4px;">123123</code>`,
        confirmButtonText: "OK",
      }).then(() => loadResetRequests());
    } else {
      Swal.fire({ icon: "error", title: "Ralat", text: result.message });
    }
  } catch (err) {
    Swal.fire({ icon: "error", title: "Ralat Sistem", text: "Gagal menghubungi pelayan." });
  }
}

async function updateCapabilities(index, fieldName, isChecked) {
  const staff = appData.Staff[index];
  staff[fieldName] = isChecked;
  
  try {
    const res = await fetch(`${API_BASE_URL}/admin/staff/${staff.id}/capabilities`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ field: fieldName, value: isChecked })
    });
    const result = await res.json();
    if (result.status === "success") {
      // Optional: show a small toast, but it's instant so maybe not needed
    } else {
      Swal.fire({ icon: "error", title: "Ralat", text: result.message });
      // Revert the checkbox if failed
      staff[fieldName] = !isChecked;
      renderTable('Staff');
    }
  } catch (err) {
    Swal.fire({ icon: "error", title: "Ralat Sistem", text: "Gagal menyimpan." });
    staff[fieldName] = !isChecked;
    renderTable('Staff');
  }
}

let mapInstance = null;
let currentMarker = null;

function openMapPicker(index) {
  const branch = appData.Branches[index];
  const initialLat = branch.lat || 3.1390; // Default: KL
  const initialLng = branch.lng || 101.6869;

  Swal.fire({
    title: `Lokasi GPS: ${escapeHTML(branch.name)}`,
    html: `
      <p style="font-size:13px; color:#666; margin-bottom:10px;">Klik pada peta untuk menetapkan koordinat (Pin Merah).</p>
      <div id="map-picker" style="height: 350px; border-radius: 8px; border: 1px solid #ccc; z-index:0;"></div>
      <div style="margin-top:15px; display:flex; gap:10px;">
        <input type="text" id="map-lat" class="input-field" value="${initialLat}" style="flex:1; background:#ffffff; border:1px solid #ccc; padding:8px; border-radius:6px;" onchange="updateMapFromInput()">
        <input type="text" id="map-lng" class="input-field" value="${initialLng}" style="flex:1; background:#ffffff; border:1px solid #ccc; padding:8px; border-radius:6px;" onchange="updateMapFromInput()">
      </div>
    `,
    width: 600,
    showCancelButton: true,
    confirmButtonText: "Simpan Koordinat",
    cancelButtonText: "Batal",
    didOpen: () => {
      // Initialize Leaflet map inside SweetAlert (Higher zoom for better shop visibility)
      mapInstance = L.map("map-picker").setView([initialLat, initialLng], 17);
      
      // Use Google Maps standard tiles for better detail
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        attribution: "© Google Maps",
        maxZoom: 21
      }).addTo(mapInstance);
      
      window.updateMapFromInput = function() {
        const lat = parseFloat(document.getElementById("map-lat").value);
        const lng = parseFloat(document.getElementById("map-lng").value);
        if (!isNaN(lat) && !isNaN(lng)) {
           const latlng = [lat, lng];
           mapInstance.setView(latlng, 18);
           if (currentMarker) {
              currentMarker.setLatLng(latlng);
           } else {
              currentMarker = L.marker(latlng).addTo(mapInstance);
           }
        }
      };
      
      // Tambah fungsi carian lokasi (Search Bar)
      L.Control.geocoder({
        defaultMarkGeocode: false
      })
      .on('markgeocode', function(e) {
        var bbox = e.geocode.bbox;
        var poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest()
        ]);
        mapInstance.fitBounds(poly.getBounds());
      })
      .addTo(mapInstance);

      if (branch.lat && branch.lng) {
         currentMarker = L.marker([branch.lat, branch.lng]).addTo(mapInstance);
      }

      mapInstance.on("click", function(e) {
         const lat = e.latlng.lat.toFixed(6);
         const lng = e.latlng.lng.toFixed(6);
         
         if (currentMarker) {
            currentMarker.setLatLng(e.latlng);
         } else {
            currentMarker = L.marker(e.latlng).addTo(mapInstance);
         }
         
         document.getElementById("map-lat").value = lat;
         document.getElementById("map-lng").value = lng;
      });
      
      // Fix leaflet rendering bug in hidden div (sweetalert opening animation)
      setTimeout(() => { mapInstance.invalidateSize(); }, 250);
    },
    preConfirm: () => {
      const lat = parseFloat(document.getElementById("map-lat").value);
      const lng = parseFloat(document.getElementById("map-lng").value);
      if (isNaN(lat) || isNaN(lng)) {
         Swal.showValidationMessage("Sila letakkan pin di atas peta.");
         return false;
      }
      return { lat, lng };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      appData.Branches[index].lat = result.value.lat;
      appData.Branches[index].lng = result.value.lng;
      
      Swal.fire({
         icon: "success",
         title: "Tersimpan Sementara",
         text: "Koordinat berjaya ditetapkan. Sila tekan 'Simpan ke Cloud' untuk simpan sepenuhnya.",
         timer: 2000,
         showConfirmButton: false
      });
    }
    
    // Cleanup map instance
    if (mapInstance) {
       mapInstance.remove();
       mapInstance = null;
       currentMarker = null;
    }
  });
}

