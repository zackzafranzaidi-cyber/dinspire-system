const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

const oldTr = `if (tab === 'Staff') {
        let typeStr = item.status_pekerja === 'part_time' ? "Part Time" : "Full Time";
        let branchName = getBranchName(item.branch_id);
        tr.innerHTML = \`
          <td class="px-4 py-3 text-sm font-medium text-gray-900">\${escapeHTML(item.username)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${escapeHTML(item.jenis_staf)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${escapeHTML(branchName)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${escapeHTML(typeStr)}</td>
          <td class="px-4 py-3 text-right">\`;`;

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

content = content.replace(oldTr, newTr);
fs.writeFileSync('public/owner/js/owner_cms.js', content);
console.log("Updated CMS Tr");
