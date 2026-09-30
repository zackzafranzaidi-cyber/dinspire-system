const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

// 1. Remove Walk-In Rawatan from sidebar
html = html.replace(/<a href="#" onclick="switchTab\('cms'\); if\(typeof initAdminCMS === 'function'\) initAdminCMS\(\); \n?switchAdminTab\('WalkInTreatments'\);" id="nav-cms-WalkInTreatments"[\s\S]*?<\/a>/, '');
// 2. Change Walk-In Gunting to Senarai Servis Walk-In and link to WalkInAll
html = html.replace(/switchAdminTab\('WalkInServices'\);" id="nav-cms-WalkInServices"([^>]+)>Walk-In Gunting<\/a>/, `switchAdminTab('WalkInAll');" id="nav-cms-WalkInAll"$1>Senarai Servis Walk-In</a>`);

// Mobile dropdown
html = html.replace(/<option value="WalkInTreatments">Walk-In Rawatan<\/option>/, '');
html = html.replace(/<option value="WalkInServices">Walk-In Gunting<\/option>/, '<option value="WalkInAll">Senarai Servis Walk-In</option>');

fs.writeFileSync('public/owner/index.html', html);

let cms = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');
cms = cms.replace(/WalkInServices: \["id", "name", "price"\],\s*WalkInTreatments: \["id", "name", "price"\],/, 'WalkInAll: ["id", "name", "price", "kategori"],');
cms = cms.replace(/WalkInServices: "Walk-In Haircuts",\s*WalkInTreatments: "Walk-In Treatments",/, 'WalkInAll: "Senarai Servis Walk-In",');

// Modify renderAdminTable to inject dropdown for kategori
const renderTableOld = `if (col === "kemahiran") {
            td.innerHTML = \`<input type="text" value="\${escapeHTML(val)}" onchange="updateCMSData('\${currentTab}', \${idx}, '\${col}', this.value)" class="w-full text-sm border-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1">\`;
          }`;
const renderTableNew = `if (col === "kemahiran") {
            td.innerHTML = \`<input type="text" value="\${escapeHTML(val)}" onchange="updateCMSData('\${currentTab}', \${idx}, '\${col}', this.value)" class="w-full text-sm border-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1">\`;
          } else if (col === "kategori" && currentTab === "WalkInAll") {
            td.innerHTML = \`<select onchange="updateCMSData('\${currentTab}', \${idx}, '\${col}', this.value)" class="w-full text-sm border border-gray-200 rounded px-1 py-0.5 bg-white">
                <option value="Walk-in" \${val === 'Walk-in' ? 'selected' : ''}>Potongan (Haircut)</option>
                <option value="Treatment Walk-in" \${val === 'Treatment Walk-in' ? 'selected' : ''}>Rawatan (Treatment)</option>
                <option value="Combo Walk-in" \${val === 'Combo Walk-in' ? 'selected' : ''}>Pakej Kombo</option>
            </select>\`;
          }`;
cms = cms.replace(renderTableOld, renderTableNew);

fs.writeFileSync('public/owner/js/owner_cms.js', cms);
console.log("Phase 3 Done");
