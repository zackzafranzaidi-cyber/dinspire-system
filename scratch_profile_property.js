const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexProfileBorder = /\.profile-avatar-wrapper::before,\s*\.profile-avatar-wrapper::after \{[\s\S]*?z-index: 0;\s*\}/;

const newProfileBorder = `
.profile-avatar-wrapper::before,
.profile-avatar-wrapper::after {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
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

css = css.replace(regexProfileBorder, newProfileBorder);
fs.writeFileSync('public/css/index.css', css);
console.log("Applied @property conic-gradient animation to profile avatar as well.");
