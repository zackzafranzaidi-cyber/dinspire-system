const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newRenderServis = `function renderTxServisTable(bookings) {
  const tbody = document.getElementById("table-tx-servis");
  let data = [...bookings].sort((a, b) => Date.parse(b.Timestamp || b.Date) - Date.parse(a.Timestamp || a.Date));
  if (data.length === 0) {
    tbody.innerHTML = \`<tr><td class="text-center py-6 text-gray-400 italic text-xs" data-i18n="table-no-record">\${i18n[currentLang] && i18n[currentLang]["table-no-record"] ? i18n[currentLang]["table-no-record"] : "Tiada Rekod"}</td></tr>\`;
    return;
  }

  tbody.innerHTML = data.map((b, index) => {
      let d = b.Timestamp ? new Date(b.Timestamp) : new Date(b.Date);
      let tFormat = "";
      if (!isNaN(d)) {
        const months = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogo","Sep","Okt","Nov","Dis"];
        tFormat = \`\${String(d.getDate()).padStart(2, "0")} \${months[d.getMonth()]}, \${b.Time || ""}\`;
      } else {
        tFormat = b.Date + " " + (b.Time || "");
      }

      let typeStr = b.Type || "Booking";
      let badge = (typeStr.toLowerCase().includes("walk") || b.Category === "Walk-In") ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-700";
      let btn = b.ReceiptLink && b.ReceiptLink.includes("http") ? \`<button onclick="event.stopPropagation(); openReceiptModal('\${b.ReceiptLink}')" class="mt-2 bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold w-full transition shadow-sm">Lihat Resit</button>\` : "";

      let dotHtml = (window.newSelesaiCount && index < window.newSelesaiCount) ? '<div class="servis-new-dot w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2 inline-block relative -top-0.5"></div>' : '';

      return \`
        <tr class="block w-full !bg-white border border-gray-100 rounded-lg mb-1.5 shadow-sm hover:shadow-md transition">
            <td class="block w-full p-0">
                <div class="px-3 py-1.5 cursor-pointer" onclick="document.getElementById('det-s-\${index}').classList.toggle('hidden')">
                    <div class="text-[9px] text-gray-400 mb-0.5 leading-none tracking-wide">\${tFormat}</div>
                    <div class="flex justify-between items-center mt-0.5">
                        <div class="max-w-[70%] text-left">
                            <div class="text-[12px] text-gray-800 uppercase font-bold leading-none">\${escapeHTML(b.Username || "PELANGGAN")}\${dotHtml}</div>
                            <div class="text-[10px] text-gray-400 mt-1 leading-none truncate">\${escapeHTML(b.ServiceName || "-")}</div>
                        </div>
                        <div class="text-right flex flex-col justify-center">
                            <div class="text-[12px] font-semibold text-blue-600 tracking-wide leading-none">+RM \${(parseFloat(b.Price) || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div id="det-s-\${index}" class="hidden bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-100 rounded-b-lg">
                    <div class="mb-2"><span class="px-2 py-0.5 rounded text-[8px] font-bold \${badge} uppercase tracking-wider">\${escapeHTML(b.Category)}</span></div>
                    <div class="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">No. Order</span><span class="font-bold text-gray-900">\${escapeHTML(b.OrderNo || "-")}</span></div>
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Barber</span><span class="font-bold text-gray-900">\${escapeHTML(b.Barber || "-")}</span></div>
                        <div><span class="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Cara Bayaran</span><span class="font-bold text-gray-900">\${escapeHTML(typeStr)}</span></div>
                    </div>
                    \${btn}
                </div>
            </td>
        </tr>\`;
    }).join("");
}`;

code = code.replace(/function renderTxServisTable\(bookings\)\s*\{[\s\S]*?(?=\nfunction renderTxProdukTable)/, newRenderServis + '\n');
fs.writeFileSync('public/js/owner.js', code);
