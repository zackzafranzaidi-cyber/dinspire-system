const fs = require('fs');
let cms = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

// The line generating staff table header:
// let html = '<tr><th>ID</th><th>Nama Staf</th><th>Cawangan</th><th>Status Pekerja</th><th>Potong Rambut</th><th>Rawatan</th></tr>';
const headerRegex = /let html = '<tr><th>ID<\/th><th>Nama Staf<\/th><th>Cawangan<\/th><th>Status Pekerja<\/th><th>Potong Rambut<\/th><th>Rawatan<\/th><\/tr>';/;
cms = cms.replace(headerRegex, "let html = '<tr><th>ID</th><th>Nama Staf</th><th>Cawangan</th><th>Status Pekerja</th><th>Potong Rambut</th><th>Rawatan</th><th>Masih Bekerja?</th></tr>';");

// The row rendering:
const rowRegex = /html \+= `\s*<tr>\s*<td>\$\{item\.id\}<\/td>\s*<td><input type="text" value="\$\{item\.username\}" onchange="updateData\('staff', '\$\{item\.id\}', 'username', this\.value\)" \/><\/td>\s*<td>\$\{branchSelect\}<\/td>\s*<td>\$\{statusSelect\}<\/td>\s*<td style="text-align:center;">\s*<label class="switch">\s*<input type="checkbox" \$\{item\.can_haircut \? 'checked' : ''\} onchange="toggleCapability\('\$\{item\.id\}', 'can_haircut', this\.checked\)">\s*<span class="slider round"><\/span>\s*<\/label>\s*<\/td>\s*<td style="text-align:center;">\s*<label class="switch">\s*<input type="checkbox" \$\{item\.can_treatment \? 'checked' : ''\} onchange="toggleCapability\('\$\{item\.id\}', 'can_treatment', this\.checked\)">\s*<span class="slider round"><\/span>\s*<\/label>\s*<\/td>\s*<\/tr>\s*`;/;

const newRow = `html += \`
                <tr>
                    <td>\${item.id}</td>
                    <td><input type="text" value="\${item.username}" onchange="updateData('staff', '\${item.id}', 'username', this.value)" /></td>
                    <td>\${branchSelect}</td>
                    <td>\${statusSelect}</td>
                    <td style="text-align:center;">
                        <label class="switch">
                            <input type="checkbox" \${item.can_haircut ? 'checked' : ''} onchange="toggleCapability('\${item.id}', 'can_haircut', this.checked)">
                            <span class="slider round"></span>
                        </label>
                    </td>
                    <td style="text-align:center;">
                        <label class="switch">
                            <input type="checkbox" \${item.can_treatment ? 'checked' : ''} onchange="toggleCapability('\${item.id}', 'can_treatment', this.checked)">
                            <span class="slider round"></span>
                        </label>
                    </td>
                    <td style="text-align:center;">
                        <label class="switch">
                            <input type="checkbox" \${item.is_active !== false ? 'checked' : ''} onchange="toggleCapability('\${item.id}', 'is_active', this.checked)">
                            <span class="slider round" style="background-color: #ccc;"></span>
                        </label>
                        <br><small style="color:gray;">\${item.is_active !== false ? 'Aktif' : 'Berhenti'}</small>
                    </td>
                </tr>
            \`;`;
            
cms = cms.replace(rowRegex, newRow);

fs.writeFileSync('public/owner/js/owner_cms.js', cms);
console.log("Updated owner_cms.js");
