const fs = require('fs');
let code = fs.readFileSync('public/js/staff.js', 'utf8');

const newSwitchView = `function switchView(id) {
  if (id === 'walkin' && !staffData.isPunchedIn) {
      alert("Anda mesti Punch-In (Hadir) terlebih dahulu di tab Profile sebelum mendaftar pelanggan Walk-In!");
      return;
  }
  
  if (id === 'profile') {
      if (typeof loggedInStaff !== 'undefined' && loggedInStaff) {
          localStorage.setItem('din_seen_leaves_count_' + loggedInStaff.id, window.totalLeavesProcessed || 0);
      }
      const badgeProfile = document.getElementById('badge-profile');
      if (badgeProfile) badgeProfile.style.display = 'none';
  }`;

code = code.replace(/function switchView\(id\)\s*\{\s*if\s*\(id\s*===\s*'walkin'[\s\S]*?return;\s*\}/, newSwitchView);
fs.writeFileSync('public/js/staff.js', code);
