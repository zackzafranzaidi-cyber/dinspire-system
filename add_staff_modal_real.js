const fs = require('fs');
let html = fs.readFileSync('public/staff/index.html', 'utf8');

const modalHTML = `
<!-- MODAL REQUEST EDIT -->
<div id="requestEditModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
    <div style="background: #1e1e1e; padding: 20px; border-radius: 12px; width: 100%; max-width: 400px; color: white;">
        <span style="float:right; font-size: 24px; cursor: pointer; color: #ccc;" onclick="closeRequestEditModal()">&times;</span>
        <h3 style="margin-top: 0; margin-bottom: 15px;">Mohon Edit Rekod</h3>
        <p style="font-size: 13px; color: #aaa; margin-bottom: 15px;">Sila masukkan maklumat baru untuk rekod ini. Permohonan akan dihantar kepada Owner untuk kelulusan.</p>
        
        <input type="hidden" id="edit_transaction_id">
        <input type="hidden" id="edit_transaction_table">
        
        <div class="form-group" style="margin-top: 15px;">
            <label style="display:block; margin-bottom:5px; font-size:13px;">Harga Baru (RM):</label>
            <input type="number" id="edit_new_price" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;" placeholder="Cth: 20" required>
        </div>
        
        <div class="form-group" style="margin-top: 15px;">
            <label style="display:block; margin-bottom:5px; font-size:13px;">Kaedah Pembayaran Baru:</label>
            <select id="edit_new_payment_method" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;">
                <option value="CASH">CASH</option>
                <option value="QR">QR / Transfer</option>
            </select>
        </div>
        
        <div class="form-group" style="margin-top: 15px;">
            <label style="display:block; margin-bottom:5px; font-size:13px;">Sebab Edit:</label>
            <select id="edit_reason" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;">
                <option value="Tersalah masuk harga">Tersalah masuk harga</option>
                <option value="Tersalah pilih kaedah bayaran">Tersalah pilih kaedah bayaran</option>
                <option value="Pelanggan tambah servis (Walk-In)">Pelanggan tambah servis (Walk-In)</option>
                <option value="Lain-lain">Lain-lain (Sila hubungi Owner)</option>
            </select>
        </div>
        
        <button class="btn btn-primary" style="width: 100%; margin-top: 20px; padding:12px; background:var(--primary); color:white; border:none; border-radius:8px; font-weight:bold;" onclick="submitEditRequest()">Hantar Permohonan</button>
    </div>
</div>
`;

if (!html.includes('id="requestEditModal"')) {
    html = html.replace('<!-- MODAL SELESAI RAWATAN -->', modalHTML + '\n\n        <!-- MODAL SELESAI RAWATAN -->');
    fs.writeFileSync('public/staff/index.html', html);
    console.log("SUCCESS: Added modal to staff HTML");
} else {
    console.log("Modal already exists!");
}
