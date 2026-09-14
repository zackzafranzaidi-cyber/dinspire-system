const fs = require('fs');
let code = fs.readFileSync('public/js/staff.js', 'utf8');

const newUpdateBadges = `// UPDATE STAFF BADGES
async function updateStaffBadges() {
     if (typeof loggedInStaff === 'undefined' || !loggedInStaff) return;
     
     // Booking Badge
     if (typeof staffData !== 'undefined' && staffData && staffData.bookings) {
         let bookingCount = 0;
         staffData.bookings.forEach(b => {
             if (b.status === 'Pending Verification' || b.status === 'Aktif') bookingCount++;
         });
         const badgeBooking = document.getElementById('badge-booking');
         if (badgeBooking) {
             if (bookingCount > 0) {
                 badgeBooking.innerText = bookingCount > 99 ? '99+' : bookingCount;
                 badgeBooking.style.display = 'block';
             } else {
                 badgeBooking.style.display = 'none';
             }
         }
     }
     
     // Profile Badge (Leaves)
     try {
         const res = await fetch(API_BASE_URL + '/staff/my-leaves', { credentials: "include" });
         if (res.ok) {
             const data = await res.json();
             let countLeaves = 0;
             if (data.leaves) {
                 data.leaves.forEach(l => {
                     if (l.status === 'Approved' || l.status === 'Rejected' || l.status === 'Batal') countLeaves++;
                 });
             }
             window.totalLeavesProcessed = countLeaves;
             
             let seenLeaves = parseInt(localStorage.getItem('din_seen_leaves_count_' + loggedInStaff.id)) || 0;
             const badgeProfile = document.getElementById('badge-profile');
             if (badgeProfile) {
                 if (countLeaves > seenLeaves) badgeProfile.style.display = 'block';
                 else badgeProfile.style.display = 'none';
             }
         }
     } catch(e) {}
}`;

code = code.replace(/\/\/ UPDATE STAFF BADGES\s*async function updateStaffBadges\(\)\s*\{[\s\S]*?catch\(e\)\s*\{\}\s*\}/, newUpdateBadges);
fs.writeFileSync('public/js/staff.js', code);
