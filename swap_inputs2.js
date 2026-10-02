const fs = require('fs');
let html = fs.readFileSync('public/staff/index.html', 'utf8');

const nameBlock = `            <div class="form-group">
              <label>Nama Pelanggan</label>
              <input
                type="text"
                id="wi-name"
                class="input-field"
                placeholder="Masukkan nama (Cth: Ali)"
              />
            </div>`;
const phoneBlock = `            <div class="form-group">
              <label>No. Telefon Pelanggan (Pilihan)</label>
              <input
                type="tel"
                id="wi-phone"
                class="input-field"
                placeholder="Cth: 0123456789"
              />
            </div>`;

// Since there are spaces/newlines, we'll use regex to grab the exact blocks.
const nameRegex = /<div class="form-group">\s*<label>Nama Pelanggan<\/label>\s*<input[^>]+id="wi-name"[^>]+>\s*<\/div>/;
const phoneRegex = /<div class="form-group">\s*<label>No\. Telefon Pelanggan \(Pilihan\)<\/label>\s*<input[^>]+id="wi-phone"[^>]+>\s*<\/div>/;

let nameMatch = html.match(nameRegex);
let phoneMatch = html.match(phoneRegex);

if (nameMatch && phoneMatch) {
    let nameHtml = nameMatch[0];
    let phoneHtml = phoneMatch[0];
    
    let combined = nameHtml + '\\s*' + phoneHtml;
    // Replace name then phone with phone then name
    html = html.replace(nameRegex, "PLACEHOLDER_NAME");
    html = html.replace(phoneRegex, nameHtml);
    html = html.replace("PLACEHOLDER_NAME", phoneHtml);
    
    fs.writeFileSync('public/staff/index.html', html);
    console.log("Successfully swapped inputs");
} else {
    console.log("Could not match the inputs");
}
