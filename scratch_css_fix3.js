const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexBar = /\.mobile-container\.tab-products-active \.checkout-bar \{[\s\S]*?padding: 40px !important;\s*\}/;
const newBar = `.mobile-container.tab-products-active .checkout-bar {
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      align-items: stretch !important;
      position: fixed !important;
      top: 0 !important;
      bottom: 0 !important;
      right: 0 !important;
      left: auto !important;
      width: 280px !important;
      height: 100dvh !important;
      border-top: none !important;
      border-left: 1px solid var(--border-color) !important;
      background-color: #f8fafc !important;
      box-shadow: -4px 0 25px rgba(0,0,0,0.03) !important;
      gap: 0 !important;
      padding: 30px 0 30px 0 !important;
    }`;

css = css.replace(regexBar, newBar);

const regexHeader = /\.checkout-bar-header \{[\s\S]*?margin-bottom: 5px;\s*\}/;
const newHeader = `.checkout-bar-header {
      display: block !important;
      width: 100%;
      text-align: left;
      margin-bottom: 20px;
      padding: 0 25px !important;
    }`;
css = css.replace(regexHeader, newHeader);

const regexItems = /\.checkout-bar-items \{[\s\S]*?margin-bottom: 20px;\s*\}/;
const newItems = `.checkout-bar-items {
      display: flex !important;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      width: 100%;
      flex-direction: column;
      gap: 0;
      margin-bottom: 20px;
    }`;
css = css.replace(regexItems, newItems);

const regexTotal = /\.checkout-bar-total \{[\s\S]*?width: 100%;\s*\}/;
const newTotal = `.checkout-bar-total {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
      width: 100%;
      padding: 0 25px !important;
    }`;
css = css.replace(regexTotal, newTotal);

const regexActions = /\.checkout-bar-actions \{[\s\S]*?gap: 10px !important;\s*\}/;
const newActions = `.checkout-bar-actions {
      flex-direction: row;
      width: 100%;
      gap: 10px !important;
      padding: 0 25px !important;
    }`;
css = css.replace(regexActions, newActions);

fs.writeFileSync('public/css/index.css', css);
console.log("Updated CSS for full-width items and fixed flex scrolling.");
