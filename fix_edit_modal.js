const fs = require('fs');

let html = fs.readFileSync('public/staff/index.html', 'utf8');

const targetHtml = `<input type="hidden" id="edit_transaction_id">
          <input type="hidden" id="edit_transaction_table">
          
          <div class="form-group" style="margin-top: 15px;">
              <label style="display:block; margin-bottom:5px; font-size:13px;">Harga Baru (RM):</label>
              <input type="number" id="edit_new_price" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;" placeholder="Cth: 20" required>
          </div>`;

const newHtml = `<input type="hidden" id="edit_transaction_id">
          <input type="hidden" id="edit_transaction_table">
          
          <div class="form-group" style="margin-top: 15px;">
              <label style="display:block; margin-bottom:5px; font-size:13px;">Kategori Servis:</label>
              <select id="edit_category" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;">
                  <option value="" disabled selected>Pilih Kategori</option>
                  <option value="Walk-in">Potongan Rambut (Haircut)</option>
                  <option value="Treatment Walk-in">Cukur & Rawatan (Treatment)</option>
                  <option value="Combo Walk-in">Pakej Kombo</option>
              </select>
          </div>
          
          <div class="form-group" id="edit_service_group" style="margin-top: 15px; display:none;">
              <label id="edit_service_label" style="display:block; margin-bottom:5px; font-size:13px;">Jenis Servis:</label>
              <select id="edit_service" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;">
                  <option value="" disabled selected>Pilih Servis</option>
              </select>
          </div>

          <div class="form-group" style="margin-top: 15px;">
              <label style="display:block; margin-bottom:5px; font-size:13px;">Harga Baru (RM):</label>
              <input type="number" id="edit_new_price" class="form-input" style="width:100%; padding:10px; border-radius:8px; background:#333; color:white; border:none;" placeholder="0.00" required readonly>
          </div>`;

html = html.replace(targetHtml, newHtml);
fs.writeFileSync('public/staff/index.html', html);
console.log("HTML Modal updated");
