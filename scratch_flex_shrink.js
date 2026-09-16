const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexHeader = /\.checkout-bar-header \{([\s\S]*?)\}/;
css = css.replace(regexHeader, '.checkout-bar-header {$1  flex-shrink: 0 !important;\n    }');

const regexTotal = /\.checkout-bar-total \{([\s\S]*?)\}/;
css = css.replace(regexTotal, '.checkout-bar-total {$1  flex-shrink: 0 !important;\n    }');

const regexActions = /\.checkout-bar-actions \{([\s\S]*?)\}/;
css = css.replace(regexActions, '.checkout-bar-actions {$1  flex-shrink: 0 !important;\n    }');

fs.writeFileSync('public/css/index.css', css);
console.log("Added flex-shrink: 0 to static elements.");
