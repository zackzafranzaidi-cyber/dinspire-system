const fs = require('fs');
const path = require('path');

// 1. Copy loader.css
const loaderSrc = path.join(__dirname, 'public/customer/css/loader.css');
const ownerDest = path.join(__dirname, 'public/owner/css/loader.css');
const staffDest = path.join(__dirname, 'public/staff/css/loader.css');
const loaderContent = fs.readFileSync(loaderSrc, 'utf8');

// For Owner & Staff, we might want to make the default color black instead of blue so it matches their simple UI
// Or keep it blue? Let's keep it exactly the same.
fs.writeFileSync(ownerDest, loaderContent);
fs.writeFileSync(staffDest, loaderContent);

// 2. Fix intro background in Customer index.html
const custHtmlPath = path.join(__dirname, 'public/customer/index.html');
let custHtml = fs.readFileSync(custHtmlPath, 'utf8');
custHtml = custHtml.replace('id="intro-screen" style="position: fixed; inset: 0; background: #007AFF;', 'id="intro-screen" style="position: fixed; inset: 0; background: #000000;');
fs.writeFileSync(custHtmlPath, custHtml);

// 3. Thin the RGB line in Customer index.css
const custCssPath = path.join(__dirname, 'public/customer/css/index.css');
let custCss = fs.readFileSync(custCssPath, 'utf8');
custCss = custCss.replace('filter: blur(15px); /* This adds the glowing effect */', 'filter: blur(8px); /* Nipiskan sikit rgb line */');
// Also try to change padding from 1px to 0.8px, some browsers respect subpixels!
custCss = custCss.replace('padding: 1px;', 'padding: 0.8px;');
fs.writeFileSync(custCssPath, custCss);

console.log("Applied UI fixes");
