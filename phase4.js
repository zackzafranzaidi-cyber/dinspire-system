const fs = require('fs');

// 1. UPDATE HTML
let html = fs.readFileSync('public/staff/index.html', 'utf8');
const oldHtml = `<div class="form-group">
                <label>Jenis Potongan / Servis</label>
                <select id="wi-service" class="input-field">
                  <option value="" disabled selected>Pilih Servis</option>
                </select>
              </div>`;
              
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
html = html.replace(oldHtml, newHtml);
fs.writeFileSync('public/staff/index.html', html);

// 2. UPDATE JS
let js = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// A. Global Variable & Init Logic
js = js.replace(/if \(data\.WalkInServices\) allServices = allServices\.concat\(data\.WalkInServices\);\s*shopSettings\.walkin = allServices;[\s\S]*?wiSel\.innerHTML =[\s\S]*?\}\s*catch \(err\) \{\}/, 
`if (data.WalkInAll) shopSettings.walkin = data.WalkInAll;
    } catch (err) {}`);
    
// B. Event Listeners
const oldListeners = `document
      .getElementById("wi-service")
      ?.addEventListener("change", autoFillPrice);`;
      
const newListeners = `document
      .getElementById("wi-category")
      ?.addEventListener("change", handleCategoryChange);
    document
      .getElementById("wi-service")
      ?.addEventListener("change", autoFillPrice);`;
js = js.replace(oldListeners, newListeners);

// C. Handlers
const handlers = `
  function handleCategoryChange() {
    const catSel = document.getElementById("wi-category").value;
    const srvGroup = document.getElementById("wi-service-group");
    const srvLabel = document.getElementById("wi-service-label");
    const srvSel = document.getElementById("wi-service");
    const priceInput = document.getElementById("wi-price");
    
    // Reset service & price
    srvSel.innerHTML = '<option value="" disabled selected>Pilih Jenis Servis</option>';
    priceInput.value = "";
    priceInput.readOnly = false;
    
    if (!catSel) {
      srvGroup.style.display = "none";
      return;
    }
    
    srvGroup.style.display = "block";
    if (catSel === "Walk-in") srvLabel.textContent = "Jenis Potongan (Haircut)";
    else if (catSel === "Treatment Walk-in") srvLabel.textContent = "Jenis Rawatan (Treatment)";
    else srvLabel.textContent = "Jenis Kombo";
    
    const filtered = (shopSettings.walkin || []).filter(s => s.kategori === catSel || (!s.kategori && catSel === "Walk-in"));
    
    srvSel.innerHTML += filtered.map(s => {
      const p = (s.price == 0) ? "" : s.price;
      return \`<option value="\${s.id}" data-price="\${p}">\${escapeHTML(s.name)}</option>\`;
    }).join("");
  }
`;
js = js.replace('function autoFillPrice() {', handlers + '\n  function autoFillPrice() {');

// D. Validation & Reset
js = js.replace(/const serviceId = document\.getElementById\("wi-service"\)\.value;/, `const category = document.getElementById("wi-category").value;\n    const serviceId = document.getElementById("wi-service").value;`);
js = js.replace(/if \(!phone \|\| !serviceId \|\| !paymentMethod\) \{/, `if (!phone || !category || !serviceId || !paymentMethod) {`);
js = js.replace(/document\.getElementById\("wi-service"\)\.value = "";/, `document.getElementById("wi-category").value = "";\n          document.getElementById("wi-service").value = "";\n          document.getElementById("wi-service-group").style.display = "none";`);

fs.writeFileSync('public/staff/js/staff.js', js);
console.log("Phase 4 Done");
