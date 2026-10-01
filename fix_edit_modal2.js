const fs = require('fs');

let html = fs.readFileSync('public/staff/index.html', 'utf8');

const targetHtml = /<input type="hidden" id="edit_transaction_id">\s*<input type="hidden" id="edit_transaction_table">\s*<div class="form-group" style="margin-top: 15px;">\s*<label style="display:block; margin-bottom:5px; font-size:13px;">Harga Baru \(RM\):<\/label>\s*<input type="number" id="edit_new_price" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;" placeholder="Cth: 20" required>\s*<\/div>/;

const newHtml = `<input type="hidden" id="edit_transaction_id">
          <input type="hidden" id="edit_transaction_table">
          
          <div class="form-group" style="margin-top: 15px;">
              <label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold; color:#facc15;">Kategori Servis:</label>
              <select id="edit_category" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#444; color:white; border:1px solid #555;">
                  <option value="" disabled selected>Pilih Kategori</option>
                  <option value="Walk-in">Potongan Rambut (Haircut)</option>
                  <option value="Treatment Walk-in">Cukur & Rawatan (Treatment)</option>
                  <option value="Combo Walk-in">Pakej Kombo</option>
              </select>
          </div>
          
          <div class="form-group" id="edit_service_group" style="margin-top: 15px; display:none;">
              <label id="edit_service_label" style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold; color:#facc15;">Jenis Servis:</label>
              <select id="edit_service" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#444; color:white; border:1px solid #555;">
                  <option value="" disabled selected>Pilih Servis</option>
              </select>
          </div>

          <div class="form-group" style="margin-top: 15px;">
              <label style="display:block; margin-bottom:5px; font-size:13px;">Harga Baru (RM):</label>
              <input type="number" id="edit_new_price" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;" placeholder="0.00" required readonly>
          </div>`;

if (targetHtml.test(html)) {
    html = html.replace(targetHtml, newHtml);
    fs.writeFileSync('public/staff/index.html', html);
    console.log("HTML Modal updated successfully");
} else {
    console.log("REGEX FAILED TO MATCH");
}
