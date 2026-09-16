const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Remove old barber pole animation
const regexBarberCSS = /\/\* Barber Pole Avatar Animation \*\/[\s\S]*?@keyframes barber-spin \{\s*100% \{ transform: rotate\(360deg\); \}\s*\}/;

const newElegantBorderCSS = `
  /* Elegant Profile Avatar Border (Matching RGB border) */
  .profile-avatar-wrapper {
    position: relative;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    padding: 1.5px;
    overflow: hidden;
    margin: 0 auto 12px;
    background-color: var(--border-color);
  }
  
  .profile-avatar-wrapper::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      #ff2a2a 0%,
      #ffffff 25%,
      #105de9 50%,
      #ff2a2a 75%,
      #ffffff 100%
    );
    animation: spinBorder 3s linear infinite;
    z-index: 0;
  }
  
  .profile-avatar-wrapper img {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--bg-surface);
  }
`;

css = css.replace(regexBarberCSS, newElegantBorderCSS);
fs.writeFileSync('public/css/index.css', css);
console.log("Updated CSS with elegant profile border.");
