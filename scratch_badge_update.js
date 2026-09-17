const fs = require('fs');
let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
js = js.replace(/const badge = document\.getElementById\('badge-notifications'\);/g, "const badge = document.getElementById('badge-notifications');\n    const desktopBadge = document.getElementById('desktop-nav-badge');");

js = js.replace(/if \(badge\) badge\.style\.display = 'none';/g, "if (badge) badge.style.display = 'none';\n        if (desktopBadge) desktopBadge.style.display = 'none';");

js = js.replace(/if \(badge\) \{\n      if \(pendingUnread > 0\) \{\n        badge\.innerText = pendingUnread > 99 \? '99\+' : pendingUnread;\n        badge\.style\.display = 'block';\n      \} else \{\n        badge\.style\.display = 'none';\n      \}\n    \}/g,
`if (badge) {
      if (pendingUnread > 0) {
        badge.innerText = pendingUnread > 99 ? '99+' : pendingUnread;
        badge.style.display = 'block';
        if (desktopBadge) {
          desktopBadge.innerText = badge.innerText;
          desktopBadge.style.display = 'block';
        }
      } else {
        badge.style.display = 'none';
        if (desktopBadge) desktopBadge.style.display = 'none';
      }
    }`);

fs.writeFileSync('public/customer/js/customer.js', js);
console.log('Badge logic updated');
