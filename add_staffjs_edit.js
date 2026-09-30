const fs = require('fs');
let staffjs = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// Inside renderHistory()
// Find: `<div style="font-weight: bold; margin-top: 10px; color: #333;">Kutipan: RM ${t.harga_rm}</div>`
// Replace with: `<div style="font-weight: bold; margin-top: 10px; color: #333;">Kutipan: RM ${t.harga_rm}</div>` + `<button class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" onclick="openRequestEditModal('${t.id}', '${tableName}', ${t.harga_rm}, '${t.payment_method}')">Request Edit</button>`

const historyCardRegex = /<div style="font-weight: bold; margin-top: 10px; color: #333;">Kutipan: RM \$\{t\.harga_rm\}<\/div>/g;
const replacement = `<div style="font-weight: bold; margin-top: 10px; color: #333; display: flex; justify-content: space-between; align-items: center;">
                    <span>Kutipan: RM \${t.harga_rm}</span>
                    <button style="background: none; border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem; cursor: pointer;" onclick="openRequestEditModal('\${t.id}', '\${tableName}', \${t.harga_rm}, '\${t.payment_method || 'CASH'}')">Request Edit</button>
                </div>`;

staffjs = staffjs.replace(historyCardRegex, replacement);

const modalFunctions = `
// ==========================================
// REQUEST EDIT FUNCTIONS
// ==========================================
function openRequestEditModal(id, table, oldPrice, oldPaymentMethod) {
    document.getElementById('edit_transaction_id').value = id;
    document.getElementById('edit_transaction_table').value = table;
    document.getElementById('edit_new_price').value = oldPrice;
    document.getElementById('edit_new_payment_method').value = oldPaymentMethod || "CASH";
    document.getElementById('requestEditModal').style.display = "flex";
}

function closeRequestEditModal() {
    document.getElementById('requestEditModal').style.display = "none";
}

async function submitEditRequest() {
    const transaction_id = document.getElementById('edit_transaction_id').value;
    const transaction_table = document.getElementById('edit_transaction_table').value;
    const new_price = document.getElementById('edit_new_price').value;
    const new_payment_method = document.getElementById('edit_new_payment_method').value;
    const reason = document.getElementById('edit_reason').value;
    
    if (!new_price) return alert("Sila masukkan harga baru");
    
    try {
        const res = await fetch('/api/staff/request-edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("din_token_sys")
            },
            body: JSON.stringify({
                transaction_id,
                transaction_table,
                new_price,
                new_payment_method,
                reason
            })
        });
        const data = await res.json();
        
        if (data.status === "success") {
            alert("Permohonan Edit telah dihantar kepada Owner!");
            closeRequestEditModal();
        } else {
            alert(data.message || "Gagal menghantar permohonan");
        }
    } catch(err) {
        alert("Ralat sistem. Sila cuba sebentar lagi.");
    }
}
`;

if (!staffjs.includes('openRequestEditModal')) {
    staffjs = staffjs + '\n' + modalFunctions;
    fs.writeFileSync('public/staff/js/staff.js', staffjs);
    console.log("Updated staff.js with Request Edit logic");
} else {
    console.log("Request edit logic already exists");
}
