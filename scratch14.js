const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const listener = `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'NEW_NOTIFICATION') {
       // Silently fetch data to update badges when a push notification is received
       if (typeof fetchOwnerDashboardData === "function") {
           fetchOwnerDashboardData(true);
       }
    }
  });
}
`;

code += listener;
fs.writeFileSync('public/js/owner.js', code);
