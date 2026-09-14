const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

// Replace renderTable logic entirely for the tabular view
const renderTableRegex = /let dataArr = appData\[tabName\][\s\S]*?container\.innerHTML = html;\s*\}/;

const newRenderTable = `let dataArr = appData[tabName] || [];
  let cols = SCHEMAS[tabName];

  let html = \`<div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-4">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr class="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
\`;
  
  cols.forEach((c) => {
    if (tabName === "Branches" && (c === "lat" || c === "lng")) return;
    if (c === "id") {
      html += \`<th style="display:none;">\${c}</th>\`;
    } else {
      html += \`<th class="px-6 py-4">\${c}</th>\`;
    }
  });
  html += \`<th class="px-6 py-4 text-center" style="width: 80px;">TINDAKAN</th></tr></thead><tbody class="divide-y divide-gray-100">\`;

  dataArr.forEach((row, index) => {
    html += \`<tr class="hover:bg-indigo-50/40 transition-colors">\`;
    cols.forEach((c) => {
      if (tabName === "Branches" && (c === "lat" || c === "lng")) return;
      
      if (c === "id") {
        html += \`<td style="display:none;"><input type="hidden" value="\${escapeHTML(row[c] || "")}"></td>\`;
      } else if (c === "imageUrl") {
        let currentImg = row[c] || "https://via.placeholder.com/60?text=IMG";
        html += \`<td class="px-6 py-3"><div class="flex items-center gap-4"><img src="\${currentImg}" class="w-12 h-12 object-cover rounded-xl border border-gray-200 shadow-sm"><input type="file" accept="image/*" onchange="handleAdminImageUpload(this, '\${tabName}', \${index}, '\${c}')" class="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer w-48"></div></td>\`;
      } else if (c === "jenis_staf" && tabName === "Staff") {
        let opts = ["In-Branch", "On-Call", "General"].map(j => \`<option value="\${j}" \${row[c] === j ? "selected" : ""}>\${j}</option>\`).join("");
        html += \`<td class="px-6 py-3"><select onchange="updateData('\${tabName}', \${index}, '\${c}', this.value); setTimeout(()=>renderTable('\${tabName}'), 100);" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm">\${opts}</select></td>\`;
      } else if (c === "branch_id" && tabName === "Staff") {
        if (row.jenis_staf === "On-Call" || row.jenis_staf === "General") {
           html += \`<td class="px-6 py-3"><span class="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg border border-gray-200">Tidak Berkenaan</span></td>\`;
        } else {
           let opts = \`<option value="" disabled selected>-- Pilih Cawangan --</option>\`;
           (appData["Branches"] || []).forEach((b) => {
             let sel = row[c] === b.id ? "selected" : "";
             opts += \`<option value="\${b.id}" \${sel}>\${escapeHTML(b.name)}</option>\`;
           });
           html += \`<td class="px-6 py-3"><select onchange="updateData('\${tabName}', \${index}, '\${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm">\${opts}</select></td>\`;
        }
      } else if (c === "kemahiran" && tabName === "Staff") {
        if (row.jenis_staf === "General") {
           html += \`<td class="px-6 py-3"><span class="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg border border-gray-200">Tidak Berkenaan</span></td>\`;
        } else {
          let chkH = row.can_haircut !== false ? "checked" : "";
          let chkT = row.can_treatment !== false ? "checked" : "";
          html += \`<td class="px-6 py-3">
            <div class="flex flex-col gap-2">
              <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                <input type="checkbox" \${chkH} onchange="updateCapabilities(\${index}, 'can_haircut', this.checked)" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="text-sm font-bold text-gray-700">Guntingan</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                <input type="checkbox" \${chkT} onchange="updateCapabilities(\${index}, 'can_treatment', this.checked)" class="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500">
                <span class="text-sm font-bold text-gray-700">Rawatan</span>
              </label>
            </div>
          </td>\`;
        }
      } else if (tabName === "Branches" && c === "location") {
        html += \`<td class="px-6 py-3">
          <div class="flex gap-2 min-w-[250px]">
            <input type="text" value="\${escapeHTML(row[c] || "")}" onchange="updateData('\${tabName}', \${index}, '\${c}', this.value)" class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm placeholder-gray-400">
            <button onclick="openMapPicker(\${index})" class="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center shrink-0" title="Tetapkan Lokasi GPS">
              <i class="fas fa-map-marker-alt"></i>
            </button>
          </div>
        </td>\`;
      } else if (c === "desc") {
        html += \`<td class="px-6 py-3 w-1/3"><input type="text" value="\${escapeHTML(row[c] || "")}" onchange="updateData('\${tabName}', \${index}, '\${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm placeholder-gray-400"></td>\`;
      } else {
        html += \`<td class="px-6 py-3 min-w-[150px]"><input type="\${c==='price'||c==='stok'?'number':'text'}" value="\${escapeHTML(row[c] || "")}" onchange="updateData('\${tabName}', \${index}, '\${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold shadow-sm placeholder-gray-400 \${c==='price'?'text-indigo-600':'text-gray-700'}"></td>\`;
      }
    });

    html += \`<td class="px-6 py-3 text-center">
      <button onclick="deleteRow('\${tabName}', \${index})" class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm mx-auto" title="Padam Rekod">
        <i class="fas fa-trash text-sm"></i>
      </button>
    </td></tr>\`;
  });

  html += \`</tbody></table></div></div>\`;
  
  html += \`
    <button onclick="addRow('\${tabName}')" class="group flex items-center justify-center w-full py-5 mt-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 rounded-3xl text-indigo-600 font-bold transition-all cursor-pointer shadow-sm">
      <div class="flex items-center gap-3 group-hover:scale-105 transition-transform">
        <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
          <i class="fas fa-plus text-sm"></i>
        </div>
        Tambah Rekod Baru
      </div>
    </button>
  \`;

  container.innerHTML = html;
}`;

code = code.replace(renderTableRegex, newRenderTable);
fs.writeFileSync('public/js/owner_cms.js', code);
