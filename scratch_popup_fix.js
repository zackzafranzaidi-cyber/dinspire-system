const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const regex = /if \(Object\.keys\(cartState\)\.length === 0\) \{\s*closeModal\("edit-cart-modal"\);\s*\} else \{\s*openEditCartPopup\(\);\s*\}/g;

const newLogic = `if (Object.keys(cartState).length === 0) {
      closeModal("edit-cart-modal");
    } else {
      // Hanya kemaskini popup jika ia sedang dibuka
      if (document.getElementById("edit-cart-modal").classList.contains("active")) {
        openEditCartPopup();
      }
    }`;

js = js.replace(regex, newLogic);
fs.writeFileSync('public/js/index.js', js);
console.log("Updated updateEditCartQty to prevent unwanted popup.");
