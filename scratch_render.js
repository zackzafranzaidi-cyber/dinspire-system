const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

const statusPekerjaCode = `
      } else if (c === "status_pekerja" && tabName === "Staff") {
        let opts = ["full_time", "part_time"].map(j => \`<option value="\${j}" \${row[c] === j ? "selected" : ""}>\${j === 'full_time' ? 'Full Time' : 'Part Time'}</option>\`).join("");
        html += \`<td class="px-6 py-3"><select onchange="updateData('\${tabName}', \${index}, '\${c}', this.value)" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm">\${opts}</select></td>\`;
`;

// Insert right before branch_id rendering
content = content.replace('} else if (c === "branch_id" && tabName === "Staff") {', statusPekerjaCode + '} else if (c === "branch_id" && tabName === "Staff") {');

content = content.replace('newObj.jenis_staf = "In-Branch";', 'newObj.jenis_staf = "In-Branch";\n    newObj.status_pekerja = "full_time";');

fs.writeFileSync('public/owner/js/owner_cms.js', content);
console.log("Added status_pekerja to table render");
