const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

const schemaRegex = /Staff: \{\n\s*title: "Staf & Pekerja",\n\s*headers: \["NAMA", "PERANAN", "CAWANGAN", "STATUS \\(FT\/PT\\)"\],\n\s*fields: \[\n\s*\{ name: "username", type: "text", placeholder: "Nama Staf" \},\n\s*\{ name: "jenis_staf", type: "text", placeholder: "Contoh: Tukang Gunting" \},\n\s*\{ name: "branch_id", type: "select", options: \(\) => getBranchOptions\(\) \},\n\s*\{ name: "status_pekerja", type: "select", options: \(\) => \[{value: 'full_time', label: 'Full Time'}, {value: 'part_time', label: 'Part Time'}\] \}\n\s*\]\n\s*\}/;

const newSchema = `Staff: {
    title: "Staf & Pekerja",
    headers: ["NAMA", "PERANAN", "CAWANGAN", "JENIS", "AKTIF"],
    fields: [
      { name: "username", type: "text", placeholder: "Nama Staf" },
      { name: "jenis_staf", type: "text", placeholder: "Contoh: Tukang Gunting" },
      { name: "branch_id", type: "select", options: () => getBranchOptions() },
      { name: "status_pekerja", type: "select", options: () => [{value: 'full_time', label: 'Full Time'}, {value: 'part_time', label: 'Part Time'}] },
      { name: "is_active", type: "select", options: () => [{value: true, label: 'Aktif'}, {value: false, label: 'Berhenti'}] }
    ]
  }`;

content = content.replace(schemaRegex, newSchema);

// In renderTableRows for Staff
const trRegex = /if \(tab === 'Staff'\) \{\n\s*let typeStr = item\.status_pekerja === 'part_time' \? "Part Time" : "Full Time";\n\s*let branchName = getBranchName\(item\.branch_id\);\n\s*tr\.innerHTML = `\n\s*<td class="px-4 py-3 text-sm font-medium text-gray-900">\$\{escapeHTML\(item\.username\)\}</td>\n\s*<td class="px-4 py-3 text-sm text-gray-600">\$\{escapeHTML\(item\.jenis_staf\)\}</td>\n\s*<td class="px-4 py-3 text-sm text-gray-600">\$\{escapeHTML\(branchName\)\}</td>\n\s*<td class="px-4 py-3 text-sm text-gray-600">\$\{escapeHTML\(typeStr\)\}</td>\n\s*<td class="px-4 py-3 text-right">`;/;

const newTr = `if (tab === 'Staff') {
        let typeStr = item.status_pekerja === 'part_time' ? "Part Time" : "Full Time";
        let activeStr = item.is_active === false ? '<span class="text-red-500 font-bold">Berhenti</span>' : '<span class="text-green-500 font-bold">Aktif</span>';
        let branchName = getBranchName(item.branch_id);
        tr.innerHTML = \`
          <td class="px-4 py-3 text-sm font-medium text-gray-900">\${escapeHTML(item.username)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${escapeHTML(item.jenis_staf)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${escapeHTML(branchName)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${escapeHTML(typeStr)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${activeStr}</td>
          <td class="px-4 py-3 text-right">\`;`;

content = content.replace(trRegex, newTr);

fs.writeFileSync('public/owner/js/owner_cms.js', content);
console.log("Updated owner_cms.js for is_active");
