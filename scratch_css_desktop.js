const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexDesktop = /\.checkout-bar > div:first-child \{[\s\S]*?\.checkout-bar > div:last-child \{[\s\S]*?gap: 10px !important;\s*\}/;

const newDesktop = `.checkout-bar-header {
      display: block !important;
      width: 100%;
      text-align: left;
      margin-bottom: 5px;
    }
    
    .checkout-bar-items {
      display: flex !important;
      flex: 1;
      overflow-y: auto;
      width: 100%;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .checkout-bar-total {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
      width: 100%;
    }
    
    .checkout-bar-actions {
      flex-direction: row;
      width: 100%;
      gap: 10px !important;
    }
    
    .mobile-only-btn {
      display: none !important;
    }`;

if (css.match(regexDesktop)) {
    css = css.replace(regexDesktop, newDesktop);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Updated desktop CSS for cart layout.");
} else {
    console.log("Could not find desktop CSS block.");
}
