const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// 1. Change top/left/right/bottom from -1.5px to -1px to make the line thinner
css = css.replace(/top: -1\.5px;/g, 'top: -1px;');
css = css.replace(/left: -1\.5px;/g, 'left: -1px;');
css = css.replace(/right: -1\.5px;/g, 'right: -1px;');
css = css.replace(/bottom: -1\.5px;/g, 'bottom: -1px;');
css = css.replace(/padding: 1\.5px;/g, 'padding: 1px;');

// 2. Reduce blur from 4px to 2px for a tighter glow
css = css.replace(/filter: blur\(4px\);/g, 'filter: blur(2px); transform: translate3d(0,0,0); -webkit-mask-image: -webkit-linear-gradient(white, white); -webkit-mask-clip: border-box;');

fs.writeFileSync('public/css/index.css', css);
console.log("Applied Safari border-radius mask fix and reduced thickness.");
