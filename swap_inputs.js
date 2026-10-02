const fs = require('fs');
let html = fs.readFileSync('public/staff/index.html', 'utf8');

const targetStr = `            <div class="card-form">
              <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 20px">
                <i class="fas fa-walking text-primary mr-2"></i> Daftar Walk-In
              </h2>
              <div class="form-group">
                <label>Nama Pelanggan</label>
                <input
                  type="text"
                  id="wi-name"
                  class="input-field"
                  placeholder="Masukkan nama (Cth: Ali)"
                />
              </div>
              <div class="form-group">
                <label>No. Telefon Pelanggan (Pilihan)</label>
                <input
                  type="tel"
                  id="wi-phone"
                  class="input-field"
                  placeholder="Cth: 0123456789"
                />
              </div>`;

const replStr = `            <div class="card-form">
              <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 20px">
                <i class="fas fa-walking text-primary mr-2"></i> Daftar Walk-In
              </h2>
              <div class="form-group">
                <label>No. Telefon Pelanggan (Pilihan)</label>
                <input
                  type="tel"
                  id="wi-phone"
                  class="input-field"
                  placeholder="Cth: 0123456789"
                />
              </div>
              <div class="form-group">
                <label>Nama Pelanggan</label>
                <input
                  type="text"
                  id="wi-name"
                  class="input-field"
                  placeholder="Masukkan nama (Cth: Ali)"
                />
              </div>`;

html = html.replace(targetStr, replStr);
fs.writeFileSync('public/staff/index.html', html);
console.log("Swapped name and phone in staff html");
