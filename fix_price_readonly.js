const fs = require('fs');

// 1. Update HTML
let html = fs.readFileSync('public/staff/index.html', 'utf8');
html = html.replace('id="wi-price"', 'id="wi-price"\n                  readonly');
fs.writeFileSync('public/staff/index.html', html);

// 2. Update JS
let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// In handleCategoryChange, change priceInput.readOnly = false; to priceInput.readOnly = true;
staff = staff.replace(/srvSel\.innerHTML = '<option value="" disabled selected>Pilih Jenis Servis<\/option>';\s*priceInput\.value = "";\s*priceInput\.readOnly = false;/g, 
`srvSel.innerHTML = '<option value="" disabled selected>Pilih Jenis Servis</option>';
      priceInput.value = "";
      priceInput.readOnly = true;`);

// In autoFillPrice, fix the logic
staff = staff.replace(/if \(opt && opt\.dataset\.price\) \{[\s\S]*?\} else \{[\s\S]*?\}/, 
`if (!opt || !opt.value) {
      priceInput.value = "";
      priceInput.readOnly = true;
    } else if (opt.dataset.price) {
      priceInput.value = opt.dataset.price;
      priceInput.readOnly = true;
    } else {
      priceInput.value = "";
      priceInput.readOnly = false;
    }`);

// Also fix the reset logic in submitWalkIn
staff = staff.replace(/document\.getElementById\("wi-price"\)\.value = "";\n\s*document\.getElementById\("wi-receipt"\)\.value = "";/, 
`document.getElementById("wi-price").value = "";
          document.getElementById("wi-price").readOnly = true;
          document.getElementById("wi-receipt").value = "";`);

fs.writeFileSync('public/staff/js/staff.js', staff);

console.log("Price readonly fixed!");
