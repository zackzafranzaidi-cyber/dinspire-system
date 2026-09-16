const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexElegantBorder = /\/\* Elegant Profile Avatar Border \(Matching RGB border\) \*\/[\s\S]*?\.profile-avatar-wrapper img \{[\s\S]*?\}/;

const newGlowingBorderCSS = `
  /* Glowing Profile Avatar Border */
  .profile-avatar-wrapper {
    position: relative;
    width: 66px;
    height: 66px;
    border-radius: 50%;
    margin: 0 auto 12px;
    /* No overflow: hidden so the glow can expand outwards */
  }
  
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
  
  .profile-avatar-wrapper::after {
    filter: blur(8px);
    opacity: 0.8;
  }
  
  .profile-avatar-wrapper img {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--bg-surface);
    z-index: 1;
  }
`;

css = css.replace(regexElegantBorder, newGlowingBorderCSS);
fs.writeFileSync('public/css/index.css', css);
console.log("Updated CSS with glowing profile border.");
