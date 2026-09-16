const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// The CSS for profile avatar RGB border:
// .profile-avatar-wrapper::before,
// .profile-avatar-wrapper::after { ... }
// .profile-avatar-wrapper::after { ... }

css = css.replace(/\.profile-avatar-wrapper::before,\s*\.profile-avatar-wrapper::after\s*\{[\s\S]*?z-index:\s*0;\s*\}/, '');
css = css.replace(/\.profile-avatar-wrapper::after\s*\{[\s\S]*?opacity:\s*0\.8;\s*\}/, '');

fs.writeFileSync('public/css/index.css', css);
console.log("Removed profile avatar RGB border.");
