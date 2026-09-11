const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newRenderMarketing = `window.markWaClicked = function(phone) {
  let clicked = localStorage.getItem('din_wa_clicked_phones');
  clicked = clicked ? JSON.parse(clicked) : [];
  if (!clicked.includes(phone)) {
    clicked.push(phone);
    localStorage.setItem('din_wa_clicked_phones', JSON.stringify(clicked));
  }
  
  const dot = document.getElementById('wa-dot-' + phone);
  if (dot) dot.style.display = 'none';
  
  updateOwnerBadges();
};

function renderMarketingTable() {
  const container = document.getElementById("table-marketing");
  if (!marketingCustomers || marketingCustomers.length === 0) {
    container.innerHTML = \`<div class="text-center p-4 text-gray-500">Tiada rekod pelanggan dijumpai.</div>\`;
    return;
  }
  
  let html = \`<table class="w-full text-sm text-left">
    <thead class="text-xs text-gray-500 bg-gray-200 sticky top-0 shadow-sm uppercase tracking-wider">
      <tr>
        <th class="py-3 px-4">Nama Pelanggan</th>
        <th class="py-3 px-4">No. Telefon</th>
        <th class="py-3 px-4 text-center">Tindakan</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 bg-white">\`;

  let clicked = window.waClicked || [];
  marketingCustomers.forEach((c) => {
    const linkGrup1 = "https://chat.whatsapp.com/EkfdpBSuTML196bdnSm0QT?s=cl&p=a&ilr=1&amv=0";
    const linkGrup2 = "https://chat.whatsapp.com/IvYFBzcpFr3IEctsrhnhq1?s=cl&p=a&ilr=1&amv=0";
    
    const waText = encodeURIComponent(\`Salam sejahtera \${c.name}, kami dari Dinspire Barbershop ingin menjemput anda sertai group WhatsApp rasmi kami untuk promosi terkini!\n\nSila klik salah satu link di bawah:\nGrup 1: \${linkGrup1}\nGrup 2: \${linkGrup2}\`);
    const waLink = \`https://wa.me/\${c.phone}?text=\${waText}\`;

    let showDot = !clicked.includes(c.phone);
    let dotHtml = showDot ? \`<div id="wa-dot-\${c.phone}" class="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block ml-2 mb-0.5"></div>\` : '';

    html += \`<tr class="hover:bg-gray-50 transition border-b border-gray-100">
      <td class="py-3 px-4 font-bold text-gray-800 text-xs sm:text-sm whitespace-normal">\${escapeHTML(c.name)} \${dotHtml}<br/><span class="inline-block mt-1 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-normal">\${c.source}</span></td>
      <td class="py-3 px-4 font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">\${c.phone}</td>
      <td class="py-3 px-4 text-center">
        <a href="\${waLink}" target="_blank" onclick="window.markWaClicked('\${c.phone}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-sm font-bold transition inline-flex items-center justify-center">
          <i class="fab fa-whatsapp text-sm mr-1"></i> Jemput
        </a>
      </td>
    </tr>\`;
  });
  
  html += \`</tbody></table>\`;
  container.innerHTML = html;
}`;

code = code.replace(/function renderMarketingTable\(\)\s*\{[\s\S]*?(?=\nfunction exportMarketingCSV)/, newRenderMarketing + '\n');
fs.writeFileSync('public/js/owner.js', code);
