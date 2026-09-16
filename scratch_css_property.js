const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// 1. Remove overflow: hidden from .rgb-border-container
css = css.replace(/padding: 1\.5px;\s*overflow: hidden;/, 'padding: 1.5px;');

// 2. Add @property definition
const propertyCSS = `
@property --border-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0turn;
}
@keyframes spin-gradient {
  to {
    --border-angle: 1turn;
  }
}
`;

// 3. Replace the ::before, ::after CSS for .rgb-border-container.active
const regexActiveBorders = /\.rgb-border-container\.active::before,\s*\.rgb-border-container\.active::after \{[\s\S]*?z-index: 0;\s*\}/;

const newActiveBorders = `
.rgb-border-container.active::before,
.rgb-border-container.active::after {
  content: "";
  position: absolute;
  top: -1.5px;
  left: -1.5px;
  right: -1.5px;
  bottom: -1.5px;
  border-radius: inherit;
  background: conic-gradient(
    from var(--border-angle, 0deg),
    #ff2a2a 0%,
    #ffffff 25%,
    #105de9 50%,
    #ffffff 75%,
    #ff2a2a 100%
  );
  animation: spin-gradient 3s linear infinite;
  z-index: 0;
}
`;

css = propertyCSS + '\n' + css.replace(regexActiveBorders, newActiveBorders);

fs.writeFileSync('public/css/index.css', css);
console.log("Applied @property conic-gradient animation.");
