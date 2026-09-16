const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const desktopMediaQueryStart = css.indexOf('@media (min-width: 768px) {');

if (desktopMediaQueryStart !== -1) {
    const desktopLoginRule = `
    #account-logged-out {
      max-width: 550px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
`;
    css = css.slice(0, desktopMediaQueryStart + 27) + desktopLoginRule + css.slice(desktopMediaQueryStart + 27);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Increased max-width for login card on desktop.");
} else {
    console.log("Could not find @media (min-width: 768px)");
}
