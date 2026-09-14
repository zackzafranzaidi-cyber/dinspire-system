const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const replacement = `return \`<tr class="block w-full !bg-white border border-gray-100 rounded-lg mb-1.5 shadow-sm hover:shadow-md transition">
          <td class="block w-full p-0">
            <div class="px-3 py-1.5 cursor-pointer" onclick="document.getElementById('det-p-\${index}').classList.toggle('hidden')">
              <div class="flex justify-between items-start w-full">
                <div>
                  <span class="text-[9px] text-gray-400 mb-0.5 leading-none tracking-wide">\${tFormat}</span>
                  <div class="text-[12px] text-gray-800 uppercase font-bold leading-none">\${escapeHTML(o.Name || o.nama_pembeli || "-")}</div>
                  <div class="text-[10px] text-gray-400 mt-1 leading-none truncate uppercase">\${escapeHTML(o.Delivery || o.kaedah_penghantaran || "-")}</div>
                </div>
                <div class="text-right flex flex-col justify-center">
                  <div class="text-[12px] font-semibold text-blue-600 tracking-wide leading-none">+RM \${parseFloat(o._calculatedTotal || o.Total_Sales || o.Total || 0).toFixed(2)}</div>
                  <div class="mt-1"><span class="px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase \${badgeColor}">\${stat}</span></div>
                </div>
              </div>
            </div>
            
            <div id="det-p-\${index}" class="hidden bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-100 rounded-b-lg w-full text-left">
              <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">No Telefon</span><span class="font-bold text-gray-900 break-words">\${escapeHTML(o.Phone || o.no_telefon || "-")}</span></div>
                <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">No. Tracking</span><span class="font-bold text-gray-900 break-words">\${escapeHTML(o.Tracking || o.tracking_no || "-")}</span></div>
                <div class="col-span-2"><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Alamat</span><span class="font-bold text-gray-900 break-words">\${escapeHTML(o.Address || o.alamat_penghantaran || "-")}</span></div>
                <div class="col-span-2"><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Item</span><div class="font-medium"><ul class="list-disc pl-3 text-[11px] leading-relaxed text-gray-900">\${pNames.map((n) => \`<li>\${escapeHTML(n)}</li>\`).join("")}</ul></div></div>
              </div>
              \${btn}
              \${actionArea}
            </div>
          </td>
        </tr>\`;`;

// Find the return `...` inside mapOrderToHTML and replace it.
code = code.replace(/return `[\s\S]*?<\/tr>`;/, replacement);
fs.writeFileSync('public/js/owner.js', code);
