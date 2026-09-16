const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexGradient = /background: conic-gradient\([\s\S]*?from 0deg,[\s\S]*?#ff2a2a 0%,[\s\S]*?#ffffff 25%,[\s\S]*?#105de9 50%,[\s\S]*?#ff2a2a 75%,[\s\S]*?#ffffff 100%[\s\S]*?\);/g;

const seamlessGradient = `background: conic-gradient(
      from 0deg,
      #ff2a2a 0%,
      #ffffff 25%,
      #105de9 50%,
      #ffffff 75%,
      #ff2a2a 100%
    );`;

css = css.replace(regexGradient, seamlessGradient);

fs.writeFileSync('public/css/index.css', css);
console.log("Fixed conic gradients to be seamless.");
