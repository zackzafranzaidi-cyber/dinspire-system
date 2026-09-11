const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newFunc = `function renderTxProdukTable(completedOrders, pendingOrders = []) {
  const tbody = document.getElementById("table-tx-produk");
  let html = "";
  
  const mapOrderToHTML = (o, index) => {
    let rawItems = o.Items || o.senarai_produk;
    let pNames = [];
    try {
      let itm = typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
      for (let k in itm) pNames.push(\`\${itm[k].name} (x\${itm[k].qty})\`);
    } catch (e) {}
    let timestampVal = o.Timestamp || o.created_at;
    let d = new Date(timestampVal);
    let tFormat = "";
    if (!isNaN(d)) {
      const months = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogo","Sep","Okt","Nov","Dis"];
      tFormat = \`\${String(d.getDate()).padStart(2, "0")} \${months[d.getMonth()]}, \${String(d.getHours()).padStart(2, "0")}:\${String(d.getMinutes()).padStart(2, "0")}\`;
    } else {
      tFormat = o.Timestamp;
    }

    let rLink = o.ReceiptLink || o.resit;
    let btn = rLink && rLink.includes("http") ? \`<button onclick="event.stopPropagation(); openReceiptModal('\${rLink}')" class="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold w-full transition shadow-sm mt-2">Lihat Resit</button>\` : "";

    let stat = o.Status || o.status || "Baru";
    if (typeof rLink === "string" && rLink.includes("FPX_PENDING")) stat = "FPX Pending";
    if (typeof rLink === "string" && rLink.includes("FPX_FAILED")) stat = "FPX Gagal";

    let orderId = o.FullId || o.id;
    let badgeColor = (stat === "Pending Verification" || stat === "FPX Pending") ? "bg-yellow-100 text-yellow-800" : (stat === "Rejected" || stat === "FPX Gagal") ? "bg-red-100 text-red-700" : (stat === "Preparing" || stat === "Baru" || stat === "Belum") ? "bg-orange-100 text-orange-700" : (stat === "Shipped") ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700";

    let actionArea = "";
    if (stat === "Pending Verification") {
      actionArea = \`<div class="mt-3 flex gap-2 w-full" onclick="event.stopPropagation()">
          <button onclick="verifyProductPayment('\${orderId}', 'approve')" class="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm whitespace-nowrap">Approve</button>
          <button onclick="verifyProductPayment('\${orderId}', 'reject')" class="flex-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm whitespace-nowrap">Reject</button>
      </div>\`;
    } else if (stat === "Rejected") {
      actionArea = \`<div class="mt-3 flex w-full" onclick="event.stopPropagation()">
          <button onclick="verifyProductPayment('\${orderId}', 'approve')" class="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm whitespace-nowrap">Undo Reject</button>
      </div>\`;
    } else if (stat === "Preparing" || stat === "Baru" || stat === "Belum") {
      actionArea = \`<div class="mt-3 flex flex-wrap gap-2 items-center" onclick="event.stopPropagation()">
               <input type="text" id="track-\${orderId}" placeholder="No Tracking" class="flex-1 border border-gray-300 px-3 py-1.5 text-xs rounded-lg min-w-[120px] outline-none focus:border-blue-500 shadow-sm">
               <button onclick="updateTracking('\${orderId}')" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 font-bold shadow-sm whitespace-nowrap">Kemas Kini</button>
             </div>\`;
    }

    return \`<tr class="border-b border-gray-100 block mb-4 bg-white rounded-xl shadow-sm hover:shadow transition border overflow-hidden p-3 relative cursor-pointer" onclick="toggleAccordion('prod-acc-\${index}')">
          <td class="block">
            <div class="flex justify-between items-start w-full">
              <div>
                <span class="text-[10px] text-gray-500 font-bold tracking-wider">\${tFormat}</span>
                <div class="font-black text-gray-800 text-sm md:text-base mt-0.5 leading-tight">\${escapeHTML(o.Name || o.nama_pembeli || "-")}</div>
                <div class="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">\${escapeHTML(o.Delivery || o.kaedah_penghantaran || "-")}</div>
              </div>
              <div class="text-right flex flex-col items-end">
                <span class="font-black text-blue-600 text-sm md:text-base">+RM \${parseFloat(o._calculatedTotal || o.Total_Sales || o.Total || 0).toFixed(2)}</span>
                <span class="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase \${badgeColor}">\${stat}</span>
              </div>
            </div>
            
            <div id="prod-acc-\${index}" class="hidden mt-3 pt-3 border-t border-gray-100 w-full text-left">
              <div class="grid grid-cols-2 gap-y-2 text-xs">
                <div class="text-gray-500 font-semibold tracking-wider text-[10px] uppercase">No Telefon:</div>
                <div class="text-gray-800 font-medium break-words">\${escapeHTML(o.Phone || o.no_telefon || "-")}</div>
                <div class="text-gray-500 font-semibold tracking-wider text-[10px] uppercase">Alamat:</div>
                <div class="text-gray-800 font-medium break-words">\${escapeHTML(o.Address || o.alamat_penghantaran || "-")}</div>
                <div class="text-gray-500 font-semibold tracking-wider text-[10px] uppercase">No. Tracking:</div>
                <div class="text-gray-800 font-medium break-words">\${escapeHTML(o.Tracking || o.tracking_no || "-")}</div>
                <div class="text-gray-500 font-semibold tracking-wider text-[10px] uppercase">Item:</div>
                <div class="text-gray-800 font-medium"><ul class="list-disc pl-3 text-[11px] leading-relaxed text-gray-600">\${pNames.map((n) => \`<li>\${escapeHTML(n)}</li>\`).join("")}</ul></div>
              </div>
              \${btn}
              \${actionArea}
            </div>
            <div class="w-full text-center mt-2 text-gray-300 text-[10px]"><i class="fas fa-chevron-down"></i></div>
          </td>
        </tr>\`;
  };

  if (pendingOrders && pendingOrders.length > 0) {
    let pendingData = [...pendingOrders].sort((a, b) => Date.parse(b.Timestamp || b.created_at) - Date.parse(a.Timestamp || a.created_at));
    html += \`<tr><td class="pt-2 pb-2"><div class="flex items-center gap-2 mb-1 pl-1"><div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div><h3 class="text-[10px] font-bold text-red-500 uppercase tracking-widest">Tindakan Diperlukan (\${pendingOrders.length})</h3></div></td></tr>\`;
    html += pendingData.map((o, idx) => mapOrderToHTML(o, 'p'+idx)).join("");
  }

  let compData = [...completedOrders].sort((a, b) => Date.parse(b.Timestamp || b.created_at) - Date.parse(a.Timestamp || a.created_at));
  if (compData.length > 0) {
    if (pendingOrders && pendingOrders.length > 0) {
       html += \`<tr><td class="pt-4 pb-2"><h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Sejarah Pesanan (\${document.getElementById('timeFilter').options[document.getElementById('timeFilter').selectedIndex].text})</h3></td></tr>\`;
    }
    html += compData.map((o, idx) => mapOrderToHTML(o, 'c'+idx)).join("");
  }

  if (html === "") {
    html = \`<tr><td class="text-center py-6 text-gray-400 italic text-xs" data-i18n="table-no-record">\${i18n[currentLang] && i18n[currentLang]["table-no-record"] ? i18n[currentLang]["table-no-record"] : "Tiada Rekod"}</td></tr>\`;
  }

  tbody.innerHTML = html;
}`

code = code.replace(/function renderTxProdukTable\(orders\)[^]*?(?=\nfunction renderReviewsTable)/, newFunc + '\n');
fs.writeFileSync('public/js/owner.js', code);
