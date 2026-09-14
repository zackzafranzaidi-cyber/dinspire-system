const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

// Inside switchTab(tabName, element = null)
// We need to add logic to hide other tabs and show tab-cms
const newLogic = `
  if (tabName === 'cms') {
    document.getElementById("tab-cms").classList.remove("hidden");
    document.getElementById("tab-cms").classList.add("block");
  }
`;

// Insert it where `tabName === 'dashboard'` is checked
code = code.replace(/if\s*\(tabName\s*===\s*'dashboard'\)\s*\{/, newLogic + "\n  if (tabName === 'dashboard') {");

fs.writeFileSync('public/js/owner.js', code);
