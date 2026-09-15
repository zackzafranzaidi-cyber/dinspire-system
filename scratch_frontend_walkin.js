const fs = require('fs');
let js = fs.readFileSync('public/js/staff.js', 'utf8');

const regex = /function submitWalkIn\(\) \{[\s\S]*?const phone = document\.getElementById\("wi-phone"\)\.value\.trim\(\);/;

const newStart = `function submitWalkIn() {
  const form = document.getElementById("walkin-form");
  const name = document.getElementById("wi-name").value.trim();
  const phone = document.getElementById("wi-phone").value.trim();
  const btn = document.getElementById("btn-submit-walkin");`;

const valRegex = /if \(\!phone \|\| \!serviceId \|\| \!paymentMethod\) \{/;
const newVal = `if (!name) {
    return alert("Sila masukkan nama pelanggan.");
  }
  if (!phone || !serviceId || !paymentMethod) {`;

const loaderRegex = /showGlobalLoader\(\);/;
const newLoader = `btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menyimpan...';
  showGlobalLoader();`;

const catchRegex = /\.catch\(\(err\) => \{[\s\S]*?\}\);/m;
const oldCatch = js.match(catchRegex)[0];
const newCatch = oldCatch + `
        .finally(() => {
          btn.disabled = false;
          btn.innerHTML = 'Sahkan Walk-In';
        });`;

js = js.replace(regex, newStart);
js = js.replace(valRegex, newVal);
js = js.replace(loaderRegex, newLoader);
js = js.replace(catchRegex, newCatch);

fs.writeFileSync('public/js/staff.js', js);
console.log("Frontend walkin submit logic updated.");
