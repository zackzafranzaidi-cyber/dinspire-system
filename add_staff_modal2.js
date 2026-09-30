const fs = require('fs');
let html = fs.readFileSync('public/staff/index.html', 'utf8');

const modalHTML = `
<!-- MODAL REQUEST EDIT -->
<div id="requestEditModal" class="modal">
    <div class="modal-content">
        <span class="close-btn" onclick="closeRequestEditModal()">&times;</span>
        <h2>Mohon Edit Rekod</h2>
        <p>Sila masukkan maklumat baru untuk rekod ini. Permohonan akan dihantar kepada Owner untuk kelulusan.</p>
        
        <input type="hidden" id="edit_transaction_id">
        <input type="hidden" id="edit_transaction_table">
        
        <div class="form-group" style="margin-top: 15px;">
            <label>Harga Baru (RM):</label>
            <input type="number" id="edit_new_price" class="form-input" placeholder="Cth: 20" required>
        </div>
        
        <div class="form-group" style="margin-top: 15px;">
            <label>Kaedah Pembayaran Baru:</label>
            <select id="edit_new_payment_method" class="form-input">
                <option value="CASH">CASH</option>
                <option value="QR">QR / Transfer</option>
            </select>
        </div>
        
        <div class="form-group" style="margin-top: 15px;">
            <label>Sebab Edit:</label>
            <select id="edit_reason" class="form-input">
                <option value="Tersalah masuk harga">Tersalah masuk harga</option>
                <option value="Tersalah pilih kaedah bayaran">Tersalah pilih kaedah bayaran</option>
                <option value="Pelanggan tambah servis (Walk-In)">Pelanggan tambah servis (Walk-In)</option>
                <option value="Lain-lain">Lain-lain (Sila hubungi Owner)</option>
            </select>
        </div>
        
        <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="submitEditRequest()">Hantar Permohonan</button>
    </div>
</div>
`;

if (!html.includes('id="requestEditModal"')) {
    html = html.replace('<script src="js/staff.js"></script>', modalHTML + '\n\n    <script src="js/staff.js"></script>');
    fs.writeFileSync('public/staff/index.html', html);
    console.log("Added modal to staff HTML");
}
