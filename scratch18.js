const fs = require('fs');
let code = fs.readFileSync('public/js/staff.js', 'utf8');

const newStaffBadges = `
     // Profile Badge (Leaves)
     try {
         const [resLeaves, resBadge] = await Promise.all([
             fetch(API_BASE_URL + '/staff/my-leaves', { credentials: "include" }),
             fetch(API_BASE_URL + '/staff/my-seen-badge', { credentials: "include" })
         ]);
         
         if (resLeaves.ok && resBadge.ok) {
             const data = await resLeaves.json();
             const badgeData = await resBadge.json();
             
             let countLeaves = 0;
             if (data.leaves) {
                 data.leaves.forEach(l => {
                     if (l.status === 'Approved' || l.status === 'Rejected' || l.status === 'Batal') countLeaves++;
                 });
             }
             window.totalLeavesProcessed = countLeaves;
             
             let seenLeaves = badgeData.count || 0;
             const badgeProfile = document.getElementById('badge-profile');
             if (badgeProfile) {
                 if (countLeaves > seenLeaves) badgeProfile.style.display = 'block';
                 else badgeProfile.style.display = 'none';
             }
         }
     } catch(e) {}
}`;
code = code.replace(/\/\/ Profile Badge \(Leaves\)[\s\S]*?catch\(e\)\s*\{\}\s*\}/, newStaffBadges);


const newSwitchView = `function switchView(id) {
  if (id === 'walkin' && !staffData.isPunchedIn) {
      alert("Anda mesti Punch-In (Hadir) terlebih dahulu di tab Profile sebelum mendaftar pelanggan Walk-In!");
      return;
  }
  
  if (id === 'profile') {
      if (typeof loggedInStaff !== 'undefined' && loggedInStaff) {
          let count = window.totalLeavesProcessed || 0;
          fetch(API_BASE_URL + '/staff/update-seen-badge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ count: count }),
              credentials: 'include'
          }).catch(e => console.error(e));
      }
      const badgeProfile = document.getElementById('badge-profile');
      if (badgeProfile) badgeProfile.style.display = 'none';
  }`;
code = code.replace(/function switchView\(id\)\s*\{\s*if\s*\(id\s*===\s*'walkin'[\s\S]*?if\s*\(badgeProfile\)\s*badgeProfile\.style\.display\s*=\s*'none';\s*\}/, newSwitchView);

fs.writeFileSync('public/js/staff.js', code);
