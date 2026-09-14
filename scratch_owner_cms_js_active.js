const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

const newSwitch = `
function switchAdminTab(tabName, el) {
  showGlobalLoader();

  currentTab = tabName;
  
  // Update sidebar active states manually
  document.querySelectorAll("[id^='nav-cms-']").forEach(nav => {
      nav.classList.remove("text-white", "bg-white/10");
      nav.classList.add("text-gray-400");
  });
  const activeNav = document.getElementById("nav-cms-" + tabName);
  if (activeNav) {
      activeNav.classList.remove("text-gray-400");
      activeNav.classList.add("text-white", "bg-white/10");
  }

  // Also sync the select dropdown just in case
  const dropdown = document.getElementById("cms-dropdown");
  if(dropdown) dropdown.value = tabName;

  let titles = {
`;

code = code.replace(/function switchAdminTab\(tabName, el\) \{\s*showGlobalLoader\(\);\s*currentTab = tabName;\s*document\s*\.querySelectorAll\("\.nav-item"\)\s*\.forEach\(\(nav\) => nav\.classList\.remove\("active"\)\);\s*if \(el\) el\.classList\.add\("active"\);\s*let titles = \{/, newSwitch);

fs.writeFileSync('public/js/owner_cms.js', code);
