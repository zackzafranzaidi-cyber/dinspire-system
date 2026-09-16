const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexBar = /\.checkout-bar \{\s*display: flex !important;[\s\S]*?padding: 40px !important;\s*\}/;
const newBar = `.mobile-container:has(#view-products.active) .checkout-bar {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
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
    gap: 20px !important;
    padding: 40px !important;
  }
  
  .mobile-container:not(:has(#view-products.active)) .checkout-bar {
    display: none !important;
  }`;

css = css.replace(regexBar, newBar);

const regexContent = /\.view-content \{\s*padding-right: 280px !important;\s*\}/;
const newContent = `.mobile-container:has(#view-products.active) .view-content {
    padding-right: 280px !important;
  }`;
css = css.replace(regexContent, newContent);

const regexNav = /\.bottom-nav \{\s*padding-left: calc\(max\(0px, \(100% - 400px\) \/ 2\)\) !important;\s*padding-right: calc\(max\(0px, \(100% - 400px\) \/ 2\) \+ 280px\) !important;\s*justify-content: space-around !important;\s*\}/;
const newNav = `.bottom-nav {
    padding-left: calc(max(0px, (100% - 400px) / 2)) !important;
    padding-right: calc(max(0px, (100% - 400px) / 2)) !important;
    justify-content: space-around !important;
  }
  .mobile-container:has(#view-products.active) .bottom-nav {
    padding-right: calc(max(0px, (100% - 400px) / 2) + 280px) !important;
  }`;

css = css.replace(regexNav, newNav);

fs.writeFileSync('public/css/index.css', css);
console.log("Updated checkout bar visibility for desktop.");
