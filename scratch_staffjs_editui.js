const fs = require('fs');
let content = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const regexStatus = /if \(b\.status === "Selesai"\) \{\n\s*statusBadge = \`<span class="badge" style="background:var\(--success\); color:white; margin-left: 5px;">SELESAI<\/span>\`;/;

const newStatus = `if (b.status === "Selesai") {
          statusBadge = \`<span class="badge" style="background:var(--success); color:white; margin-left: 5px;">SELESAI</span>\`;
          editBtn = \`<button class="btn btn-outline" style="margin-top:10px; width:100%; font-size:12px; border-color:var(--danger); color:var(--danger);" onclick="showEditModal('\${b.table_name}', '\${b.id}', '\${b.final_price || b.price}', '\${b.payment_method}')"><i class="fas fa-edit mr-2"></i> Request Edit (Salah Harga/Cara Bayaran)</button>\`;`;
          
content = content.replace(regexStatus, newStatus);

const newModalFunc = `
window.showEditModal = function(tableName, id, oldPrice, oldMethod) {
    const newPrice = prompt("Sila masukkan HARGA SEBENAR (RM):", oldPrice);
    if (newPrice === null) return;
    
    let newMethod = prompt("Sila masukkan CARA BAYARAN SEBENAR (Tunai/QR/FPX):", oldMethod);
    if (newMethod === null) return;
    
    const reason = prompt("Sila masukkan SEBAB nak edit (Cth: Tersalah tekan harga):");
    if (!reason) {
       alert("Sebab wajib diisi!");
       return;
    }
    
    if (confirm("Hantar permohonan edit kepada Bos?")) {
       submitEditRequest(tableName, id, oldPrice, newPrice, oldMethod, newMethod, reason);
    }
}

async function submitEditRequest(table, id, oPrice, nPrice, oMethod, nMethod, reason) {
    try {
        showToast("Menghantar permohonan...");
        const res = await fetch(API_BASE_URL + '/staff/request-edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('din_token_sys') },
            body: JSON.stringify({
                transaction_table: table,
                transaction_id: id,
                old_price: oPrice,
                new_price: nPrice,
                old_payment_method: oMethod,
                new_payment_method: nMethod,
                reason: reason
            })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert("Permohonan berjaya dihantar! Menunggu kelulusan Bos.");
        } else {
            alert(data.message || "Ralat sistem");
        }
    } catch(e) {
        alert("Gagal menyambung ke pelayan");
    }
}
`;

content = content.replace('// INIT', newModalFunc + '\n// INIT');

fs.writeFileSync('public/staff/js/staff.js', content);
console.log("Added edit request UI to staff.js");
