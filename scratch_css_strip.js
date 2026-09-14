const fs = require('fs');
let css = fs.readFileSync('public/css/admin.css', 'utf8');

// Strip out resets and body
css = css.replace(/\*, \*::before, \*::after\s*\{[^}]+\}/, '');
css = css.replace(/body\s*\{[^}]+\}/, '');
// Strip login overlay
css = css.replace(/#login-overlay\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box::before\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box h2\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box p\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box input\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box input:focus\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box button\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box button:hover\s*\{[^}]+\}/, '');
css = css.replace(/\.login-box button:active\s*\{[^}]+\}/, '');

// Strip sidebar and layout
css = css.replace(/\.sidebar\s*\{[^}]+\}/, '');
css = css.replace(/\.sidebar-header\s*\{[^}]+\}/, '');
css = css.replace(/\.sidebar-header \.header-icon\s*\{[^}]+\}/, '');
css = css.replace(/\.nav-list\s*\{[^}]+\}/, '');
css = css.replace(/\.nav-list::-webkit-scrollbar\s*\{[^}]+\}/, '');
css = css.replace(/\.nav-list::-webkit-scrollbar-thumb\s*\{[^}]+\}/, '');
css = css.replace(/\.nav-label\s*\{[^}]+\}/, '');
css = css.replace(/\.nav-item\s*\{[^}]+\}/g, '');
css = css.replace(/\.nav-item i\s*\{[^}]+\}/g, '');
css = css.replace(/\.nav-item:hover\s*\{[^}]+\}/g, '');
css = css.replace(/\.nav-item\.active\s*\{[^}]+\}/g, '');
css = css.replace(/\.nav-item\.active i\s*\{[^}]+\}/g, '');
css = css.replace(/\.nav-divider\s*\{[^}]+\}/, '');

css = css.replace(/\.main-content\s*\{[^}]+\}/, '');
css = css.replace(/\.topbar\s*\{[^}]+\}/, '');
css = css.replace(/\.topbar h2\s*\{[^}]+\}/, '');
css = css.replace(/\.topbar-right\s*\{[^}]+\}/, '');

fs.writeFileSync('public/css/admin.css', css);
