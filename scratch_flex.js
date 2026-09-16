const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace(/justify-content: center !important;\s*align-items: center !important;/g, "justify-content: flex-start !important;\n      align-items: stretch !important;");

fs.writeFileSync('public/css/index.css', css);
console.log("Updated checkout bar flex alignment.");
