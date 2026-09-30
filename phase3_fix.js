const fs = require('fs');
let cms = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

const targetRegex = /\} else if \(c === "desc"\) \{([\s\S]*?)\} else \{/;
const newHtml = `} else if (c === "desc") {$1} else if (c === "kategori" && tabName === "WalkInAll") {
          let opts = ["Walk-in", "Treatment Walk-in", "Combo Walk-in"].map(j => \`<option value="\${j}" \${row[c] === j || (j === 'Walk-in' && !row[c]) ? "selected" : ""}>\${j === 'Walk-in' ? 'Potongan (Haircut)' : (j === 'Treatment Walk-in' ? 'Rawatan (Treatment)' : 'Pakej Kombo')}</option>\`).join("");
          html += \`<td class="px-6 py-3"><select onchange="updateData('\${tabName}', \${index}, '\${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm">\${opts}</select></td>\`;
        } else {`;
cms = cms.replace(targetRegex, newHtml);

fs.writeFileSync('public/owner/js/owner_cms.js', cms);
console.log("Phase 3 fixed!");
