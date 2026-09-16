const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Fix border radius and blur
css = css.replace('border-radius: inherit;', 'border-radius: 16px;');
css = css.replace('filter: blur(15px); /* This adds the glowing effect */', 'filter: blur(4px); /* Thin outer glow */');
css = css.replace('opacity: 0.7;', 'opacity: 0.85;');

// Add media query rule for border-radius 12px
const mobileQueryIndex = css.indexOf('@media (max-width: 767px) {');
if (mobileQueryIndex !== -1) {
    const mobileFix = `
    .rgb-border-container.active::before,
    .rgb-border-container.active::after {
      border-radius: 12px !important;
    }
`;
    // Insert inside the mobile query
    css = css.slice(0, mobileQueryIndex + 27) + mobileFix + css.slice(mobileQueryIndex + 27);
}

fs.writeFileSync('public/css/index.css', css);
console.log("Fixed square corners and thick glow.");
