const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner.js', 'utf8');

const regex = /let totalServiceFees = 0;/;
const newCode = `let totalServiceFees = 0;
  
  const editContainer = document.getElementById("edit-requests-container");
  if (masterData.editRequests && masterData.editRequests.length > 0) {
      editContainer.classList.remove("hidden");
      let html = '<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 shadow-sm"><h3 class="text-red-700 font-bold text-xs mb-2 uppercase tracking-wider flex items-center"><i class="fas fa-exclamation-circle mr-2"></i> Permohonan Edit / Batal</h3><div class="flex flex-col gap-2">';
      masterData.editRequests.forEach(req => {
          html += \`
            <div class="bg-white rounded border border-red-100 p-2 text-xs relative">
               <div class="font-bold text-gray-800 mb-1">\${escapeHTML(req.staff ? req.staff.username : 'Staf')} memohon perubahan:</div>
               <div class="grid grid-cols-2 gap-1 mb-2 text-[10px]">
                  <div><span class="text-gray-400">Harga:</span> RM\${parseFloat(req.old_price).toFixed(2)} &rarr; <span class="font-bold text-red-600">RM\${parseFloat(req.new_price).toFixed(2)}</span></div>
                  <div><span class="text-gray-400">Bayaran:</span> \${escapeHTML(req.old_payment_method || '-')} &rarr; <span class="font-bold text-red-600">\${escapeHTML(req.new_payment_method || '-')}</span></div>
               </div>
               <div class="text-gray-600 text-[10px] bg-gray-50 p-1.5 rounded border border-gray-100 mb-2 italic">" \${escapeHTML(req.reason)} "</div>
               <div class="flex gap-2">
                  <button onclick="resolveEdit('\${req.id}', 'Approve')" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 rounded text-[10px]">LULUS (UBAH)</button>
                  <button onclick="resolveEdit('\${req.id}', 'Reject')" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1.5 rounded text-[10px]">TOLAK</button>
               </div>
            </div>
          \`;
      });
      html += '</div></div>';
      editContainer.innerHTML = html;
  } else {
      editContainer.classList.add("hidden");
      editContainer.innerHTML = '';
  }`;
  
content = content.replace(regex, newCode);

const resolveEditFunc = `
window.resolveEdit = async function(requestId, action) {
    if (!confirm(action === 'Approve' ? 'Luluskan perubahan ini?' : 'Tolak permohonan ini?')) return;
    
    try {
        showGlobalLoader();
        const res = await fetch(API_BASE_URL + '/owner/resolve-edit-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('din_token_sys') },
            body: JSON.stringify({ request_id: requestId, action: action })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert(data.message);
            fetchOwnerDashboardData(false);
        } else {
            alert(data.message || 'Ralat sistem');
        }
    } catch (e) {
        alert('Gagal menyambung ke pelayan');
    } finally {
        hideGlobalLoader();
    }
}
`;

content = content.replace('// INIT', resolveEditFunc + '\n// INIT');

fs.writeFileSync('public/owner/js/owner.js', content);
console.log("Added edit request rendering to owner.js");
