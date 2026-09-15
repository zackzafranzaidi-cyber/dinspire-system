const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const regex = /let totalWa = 0;[\s\S]*?let newWaCount = Math\.max\(0, totalWa - seenWa\);/;
const newCode = `let totalWa = 0;
      let unclickedWa = 0;
      if (typeof marketingCustomers !== "undefined" && marketingCustomers) {
          totalWa = marketingCustomers.length;
          marketingCustomers.forEach(c => {
             if (!window.waClicked.includes(c.phone)) unclickedWa++;
          });
      }
      // Provide unclicked count as the badge number so it persists until clicked
      let newWaCount = unclickedWa;`;

code = code.replace(regex, newCode);
fs.writeFileSync('public/js/owner.js', code);
console.log("Updated badge logic!");
