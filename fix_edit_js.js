const fs = require('fs');

let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// Add Event Listeners
const listenerTarget = `document.getElementById("wi-service")?.addEventListener("change", autoFillPrice);`;
const listenerNew = `document.getElementById("wi-service")?.addEventListener("change", autoFillPrice);
    document.getElementById("edit_category")?.addEventListener("change", handleEditCategoryChange);
    document.getElementById("edit_service")?.addEventListener("change", autoFillEditPrice);`;
staff = staff.replace(listenerTarget, listenerNew);

// Add Handlers
const handlersHtml = `
  function handleEditCategoryChange() {
    const catSel = document.getElementById("edit_category").value;
    const srvGroup = document.getElementById("edit_service_group");
    const srvLabel = document.getElementById("edit_service_label");
    const srvSel = document.getElementById("edit_service");
    const priceInput = document.getElementById("edit_new_price");
    
    srvSel.innerHTML = '<option value="" disabled selected>Pilih Jenis Servis</option>';
    priceInput.value = "";
    priceInput.readOnly = true;
    
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
      return \`<option value="\${s.id}" data-name="\${escapeHTML(s.name)}" data-price="\${p}">\${escapeHTML(s.name)}</option>\`;
    }).join("");
  }

  function autoFillEditPrice() {
    const sel = document.getElementById("edit_service");
    const opt = sel.options[sel.selectedIndex];
    const priceInput = document.getElementById("edit_new_price");
    if (!opt || !opt.value) {
      priceInput.value = "";
      priceInput.readOnly = true;
    } else if (opt.dataset.price) {
      priceInput.value = opt.dataset.price;
      priceInput.readOnly = true;
    } else {
      priceInput.value = "";
      priceInput.readOnly = false;
    }
  }
`;
staff = staff.replace('function autoFillPrice() {', handlersHtml + '\n  function autoFillPrice() {');

// Update openRequestEditModal to reset fields
const modalTarget = /document\.getElementById\("edit_new_price"\)\.value = "";/;
const modalNew = `document.getElementById("edit_new_price").value = "";
    document.getElementById("edit_new_price").readOnly = true;
    if (document.getElementById("edit_category")) document.getElementById("edit_category").value = "";
    if (document.getElementById("edit_service")) document.getElementById("edit_service").value = "";
    if (document.getElementById("edit_service_group")) document.getElementById("edit_service_group").style.display = "none";`;
staff = staff.replace(modalTarget, modalNew);


// Update submitRequestEdit to append service name to the reason
const submitTarget = /const reason = document\.getElementById\("edit_reason"\)\.value;/;
const submitNew = `let reason = document.getElementById("edit_reason").value;
    const catSel = document.getElementById("edit_category");
    const srvSel = document.getElementById("edit_service");
    let newServiceName = "";
    if (srvSel && srvSel.selectedIndex > 0) {
        newServiceName = srvSel.options[srvSel.selectedIndex].dataset.name;
    }
    if (newServiceName) {
        reason = reason + " | TUKAR SERVIS: " + newServiceName;
    }`;
staff = staff.replace(submitTarget, submitNew);

fs.writeFileSync('public/staff/js/staff.js', staff);
console.log("JS Modal updated");
