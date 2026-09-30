const fs = require('fs');

let html = fs.readFileSync('public/staff/index.html', 'utf8');
const targetRegex = /<div class="form-group">\s*<label>Jenis Potongan \/ Servis<\/label>\s*<select id="wi-service" class="input-field">\s*<option value="" disabled selected>Pilih Servis<\/option>\s*<\/select>\s*<\/div>/;

const newHtml = `<div class="form-group">
                <label>Kategori Servis</label>
                <select id="wi-category" class="input-field">
                  <option value="" disabled selected>Pilih Kategori</option>
                  <option value="Walk-in">Potongan Rambut (Haircut)</option>
                  <option value="Treatment Walk-in">Cukur & Rawatan (Treatment)</option>
                  <option value="Combo Walk-in">Pakej Kombo</option>
                </select>
              </div>
              <div class="form-group" id="wi-service-group" style="display:none;">
                <label id="wi-service-label">Jenis Servis</label>
                <select id="wi-service" class="input-field">
                  <option value="" disabled selected>Pilih Servis</option>
                </select>
              </div>`;

html = html.replace(targetRegex, newHtml);
fs.writeFileSync('public/staff/index.html', html);
console.log("Replaced HTML!");
