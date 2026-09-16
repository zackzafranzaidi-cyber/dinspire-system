const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

const regex = /const activeTab = document\.getElementById\("tab-" \+ tabName\);\s*if \(activeTab\) \{\s*activeTab\.classList\.remove\("hidden"\);\s*activeTab\.classList\.add\("block"\);\s*\}/;

const newLogic = `const activeTab = document.getElementById("tab-" + tabName);
  if (activeTab) {
    activeTab.classList.remove("hidden");
    activeTab.classList.add("block");
  }

  // [DIBAIKI] Sembunyikan header utama (Prestasi Keseluruhan & Filter Masa) jika berada di tab CMS
  const globalHeader = document.getElementById("global-top-header");
  if (globalHeader) {
      if (tabName === 'cms') {
          globalHeader.style.display = 'none';
      } else {
          globalHeader.style.display = 'flex';
      }
  }`;

if (regex.test(js)) {
    js = js.replace(regex, newLogic);
    fs.writeFileSync('public/js/owner.js', js);
    console.log("Updated switchTab via regex.");
} else {
    console.log("Regex failed.");
}
